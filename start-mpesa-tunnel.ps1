# start-mpesa-tunnel.ps1
# Starts ngrok tunnel, retrieves public HTTPS URL, and updates .env configuration for local M-Pesa Daraja testing on Windows

$port = 5000

# 1. Read PORT from .env if it exists
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match '(?m)^PORT=(\d+)') {
        $port = [int]$Matches[1]
    }
}

Write-Host "🚀 Starting ngrok tunnel on port $port..." -ForegroundColor Green

# 2. Start ngrok in the background
$ngrokProcess = Start-Process cmd.exe -ArgumentList "/c npx ngrok http $port" -PassThru -NoNewWindow -ErrorAction SilentlyContinue

if ($null -eq $ngrokProcess) {
    Write-Host "❌ Error: Failed to start ngrok. Ensure Node.js and npx are installed." -ForegroundColor Red
    exit 1
}

# Ensure the ngrok process is terminated when the script exits
$cleanup = {
    Write-Host "`n🛑 Stopping ngrok tunnel..." -ForegroundColor Yellow
    if ($ngrokProcess -and -not $ngrokProcess.HasExited) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    }
    exit
}

# Bind clean-up block to script exit events
$executionContext.SessionState.Module.OnRemove = $cleanup

try {
    # 3. Wait for ngrok local API to become ready (up to 15 seconds)
    Write-Host "⏳ Waiting for ngrok tunnel to be established..." -ForegroundColor Cyan
    $tunnelReady = $false
    
    for ($i = 1; $i -le 15; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $tunnelReady = $true
                break
            }
        } catch {
            # Ignore and retry
        }
        Start-Sleep -Seconds 1
    }

    if (-not $tunnelReady) {
        Write-Host "❌ Error: Could not connect to ngrok local API at http://127.0.0.1:4040" -ForegroundColor Red
        Write-Host "   Please verify that:" -ForegroundColor Red
        Write-Host "   1. ngrok is installed and authenticated: npx ngrok config add-authtoken <token>" -ForegroundColor Red
        Write-Host "   2. No other local tunnel process is blocking port 4040." -ForegroundColor Red
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }

    # 4. Fetch the public HTTPS URL from ngrok's local API
    $tunnelsJson = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
    $httpsTunnel = $tunnelsJson.tunnels | Where-Object { $_.proto -eq 'https' -or $_.public_url.StartsWith('https:') } | Select-Object -First 1
    
    if ($null -eq $httpsTunnel) {
        # Fallback to the first tunnel
        $httpsTunnel = $tunnelsJson.tunnels | Select-Object -First 1
    }

    if ($null -eq $httpsTunnel) {
        Write-Host "❌ Error: Failed to retrieve public HTTPS tunnel URL from ngrok API." -ForegroundColor Red
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }

    $publicUrl = $httpsTunnel.public_url
    $callbackUrl = "$publicUrl/api/payments/callback"

    Write-Host "✅ Tunnel successfully established: $publicUrl" -ForegroundColor Green
    Write-Host "🎯 M-Pesa Callback URL: $callbackUrl" -ForegroundColor Green

    # 5. Update MPESA_CALLBACK_URL in the .env file
    if (Test-Path ".env") {
        $content = Get-Content ".env" -Raw
        $callbackLinePattern = '(?m)^MPESA_CALLBACK_URL=.*$'
        $newLine = "MPESA_CALLBACK_URL=$callbackUrl"

        if ($content -match $callbackLinePattern) {
            $content = $content -replace $callbackLinePattern, $newLine
        } else {
            $content = $content.TrimEnd() + "`n`n# M-Pesa Local Testing`n" + $newLine + "`n"
        }
        Set-Content -Path ".env" -Value $content -NoNewline
        Write-Host "📝 Successfully updated .env with the new MPESA_CALLBACK_URL." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: .env file not found. Could not update callback URL." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "💡 Next Steps:" -ForegroundColor Green
    Write-Host "   1. KEEP THIS TERMINAL OPEN to maintain the tunnel." -ForegroundColor White
    Write-Host "   2. RESTART your Express backend server to load the updated .env." -ForegroundColor White
    Write-Host "   3. Press Ctrl+C in this terminal when you want to close the tunnel." -ForegroundColor White
    Write-Host ""

    # Keep the script running to maintain the ngrok background process
    while ($true) {
        if ($ngrokProcess.HasExited) {
            Write-Host "⚠️ ngrok process terminated unexpectedly." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }

} finally {
    # Cleanup block executes when Ctrl+C or script termination occurs
    Write-Host "`n🛑 Stopping ngrok tunnel..." -ForegroundColor Yellow
    if ($ngrokProcess -and -not $ngrokProcess.HasExited) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
