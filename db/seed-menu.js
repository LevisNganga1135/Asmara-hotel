// db/seed-menu.js
// Migration seed script to populate dishes database from menu.js catalog data

const pool = require('./db');

// Authoritative frontend MENU_ITEMS to be migrated
const MENU_ITEMS = [
    {
        id: 'asmara-kitfo',
        name: 'Asmara Kitfo (Steak Tartar)',
        price: 'KES 1,500',
        priceValue: 1500,
        category: 'fish',
        description: "Finely minced lean beef seasoned with mitmita chili blend and clarified spiced butter (nit'ir kibe). Served with minced spinach, cottage cheese, and authentic warm Injera.",
        image: 'images/asmara_kitfo.png',
        badge: 'Signature',
        spicy: true,
        allergens: 'Dairy'
    },
    {
        id: 'zilzil-tibsi',
        name: 'Zilzil Tibsi',
        price: 'KES 1,600',
        priceValue: 1600,
        category: 'fish',
        description: "Strips of tender beef fillet sizzled with green peppers, onions, tomatoes, and signature Asmara spices. Served in a traditional clay pot over hot charcoal.",
        image: 'images/zilzil_tibsi.png',
        badge: 'Bestseller',
        spicy: false,
        allergens: 'None'
    },
    {
        id: 'tsahli-tibsi',
        name: 'Tsahli Tibsi',
        price: 'KES 1,750',
        priceValue: 1750,
        category: 'fish',
        description: "Pan-fried tender goat meat (with ribs) sautéed with onions, green chilies, rosemary, and authentic Eritrean spices. Served sizzling hot.",
        image: 'images/tsahli_tibsi.png',
        badge: "Chef's Special",
        spicy: true,
        allergens: 'None'
    },
    {
        id: 'shiro-tegamino',
        name: 'Shiro Tegamino',
        price: 'KES 1,100',
        priceValue: 1100,
        category: 'fish',
        description: "Ground chickpeas and split peas simmered with garlic, onions, and berbere spices. Served bubbling hot in a traditional claypot with soft Injera.",
        image: 'images/shiro_tegamino.png',
        badge: 'Vegetarian Favourite',
        spicy: true,
        allergens: 'None'
    },
    {
        id: 'asmara-mixed-plate',
        name: 'Asmara Mixed Plate',
        price: 'KES 2,200',
        priceValue: 2200,
        category: 'fish',
        description: "A grand Eritrean/Ethiopian platter featuring Keyh Tibsi (beef stew), Minchet Abish (minced beef), Shiro, lentils, and assorted vegetables on sourdough Injera.",
        image: 'images/eritrean_injera_platter_1784108860298.png',
        badge: 'Traditional Platter',
        spicy: true,
        allergens: 'Gluten, Dairy'
    },
    {
        id: 'asmara-garlic-mushrooms',
        name: 'Asmara Garlic Mushrooms',
        price: 'KES 750',
        priceValue: 750,
        category: 'sides',
        description: "Fresh button mushrooms pan-fried in garlic butter and signature Asmara herbs, served with grilled artisan garlic bread.",
        image: 'images/asmara_garlic_mushrooms.png',
        badge: 'Popular',
        spicy: false,
        allergens: 'Gluten, Dairy'
    },
    {
        id: 'peri-peri-chicken-liver',
        name: 'Peri-Peri Chicken Liver',
        price: 'KES 850',
        priceValue: 850,
        category: 'sides',
        description: "Tender chicken livers pan-fried with hot peri-peri sauce and finished with fresh cream. Served alongside toasted garlic bread.",
        image: 'images/peri_peri_chicken_liver.png',
        badge: 'Spicy',
        spicy: true,
        allergens: 'Gluten, Dairy'
    },
    {
        id: 'merek-soup',
        name: 'Spicy Merek Soup',
        price: 'KES 600',
        priceValue: 600,
        category: 'sides',
        description: "A traditional goat-bone broth slow-simmered with onions, coriander, green chilies, and a proprietary blend of warm Eritrean spices.",
        image: 'images/merek_soup.png',
        badge: 'Hearty',
        spicy: true,
        allergens: 'None'
    },
    {
        id: 'tajiri-salad',
        name: 'Tajiri Salad',
        price: 'KES 950',
        priceValue: 950,
        category: 'sides',
        description: "Crisp mixed garden greens tossed with sliced artichoke hearts, sweet mango, roasted cashews, and a honey-lime dressing.",
        image: 'images/tajiri_salad.png',
        badge: 'Vibrant',
        spicy: false,
        allergens: 'Tree nuts'
    },
    {
        id: 'spiced-tea',
        name: 'Traditional Spiced Tea',
        price: 'KES 300',
        priceValue: 300,
        category: 'drinks',
        description: "Eritrean black tea brewed with crushed cardamom pods, cloves, and cinnamon bark. Warm, aromatic, and comforting.",
        image: 'images/spiced_tea.png',
        badge: 'Traditional',
        spicy: false,
        allergens: 'None'
    },
    {
        id: 'fresh-juice',
        name: 'Freshly Squeezed Mango Juice',
        price: 'KES 350',
        priceValue: 350,
        category: 'drinks',
        description: "Freshly squeezed sweet local mangoes, cold-pressed daily without added water or sugars.",
        image: 'images/fresh_juice.png',
        badge: '100% Organic',
        spicy: false,
        allergens: 'None'
    }
];

async function seed() {
    console.log('🔄 Seeding dishes table from local menu items data...');
    
    try {
        await pool.transaction(async trx => {
            // Remove existing items first
            await trx('dishes').del();
            
            const dishesToInsert = MENU_ITEMS.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                price_value: item.priceValue,
                category: item.category,
                description: item.description,
                image_url: item.image,
                badge: item.badge,
                is_spicy: item.spicy,
                allergens: item.allergens
            }));

            // Native bulk insert is fast and safe
            await trx('dishes').insert(dishesToInsert);
            
            for (const item of MENU_ITEMS) {
                console.log(`✓ Seeded dish: ${item.name}`);
            }
        });
        
        console.log('🎉 Menu dishes data seeded successfully!');
    } catch (err) {
        console.error('💥 Error seeding data:', err);
    } finally {
        await pool.end();
    }
}

seed();
