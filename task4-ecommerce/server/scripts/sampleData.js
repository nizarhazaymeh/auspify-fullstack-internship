export const adminUser = { name: 'Store Admin', email: 'admin@example.com', password: 'admin1234', role: 'admin' };
export const demoCustomer = {
  name: 'Demo Customer',
  email: 'demo@example.com',
  password: 'demo1234',
  address: { fullName: 'Demo Customer', phone: '+962 79 000 0000', street: '12 Rainbow Street', city: 'Amman', postalCode: '11181', country: 'Jordan' },
};

// price / compareAt in dollars; stock deliberately varied (low stock + one sold out) to show those states.
export const sampleProducts = [
  { name: 'Wireless Noise-Cancelling Headphones', brand: 'SoundCore', category: 'Electronics', emoji: '🎧', price: 129.99, compareAt: 169.99, stock: 25, featured: true, description: 'Over-ear Bluetooth headphones with active noise cancellation, 30-hour battery life and fast charging. Foldable design with a hard travel case.' },
  { name: 'Smart Fitness Watch', brand: 'Pulse', category: 'Electronics', emoji: '⌚', price: 89.0, stock: 40, featured: true, description: 'Track steps, heart rate, sleep and workouts. Water resistant to 50 m with a 7-day battery and smartphone notifications.' },
  { name: 'Portable Bluetooth Speaker', brand: 'SoundCore', category: 'Electronics', emoji: '🔊', price: 45.5, stock: 60, description: 'Compact waterproof speaker with deep bass, 12-hour playtime and a built-in strap.' },
  { name: 'Mechanical Keyboard', brand: 'KeyForge', category: 'Electronics', emoji: '⌨️', price: 74.99, compareAt: 89.99, stock: 4, description: 'Hot-swappable mechanical keyboard with tactile switches, RGB backlight and a detachable USB-C cable.' },
  { name: 'Wireless Mouse', brand: 'KeyForge', category: 'Electronics', emoji: '🖱️', price: 24.99, stock: 80, description: 'Ergonomic silent-click mouse with adjustable DPI and a USB receiver that stores inside the mouse.' },
  { name: 'USB-C Power Bank 20,000mAh', brand: 'VoltUp', category: 'Electronics', emoji: '🔋', price: 39.99, stock: 0, description: 'High-capacity power bank with 20 W fast charging; charges two devices at once.' },
  { name: 'Classic Denim Jacket', brand: 'Northwind', category: 'Fashion', emoji: '🧥', price: 59.99, stock: 18, featured: true, description: 'Timeless medium-wash denim jacket with button front and chest pockets. Relaxed fit.' },
  { name: 'Everyday Running Sneakers', brand: 'Stride', category: 'Fashion', emoji: '👟', price: 79.0, compareAt: 99.0, stock: 30, featured: true, description: 'Lightweight breathable sneakers with cushioned soles for running or all-day wear.' },
  { name: 'Leather Crossbody Bag', brand: 'Atelier', category: 'Fashion', emoji: '👜', price: 49.99, stock: 12, description: 'Genuine leather crossbody bag with adjustable strap and three interior compartments.' },
  { name: 'Polarized Sunglasses', brand: 'Northwind', category: 'Fashion', emoji: '🕶️', price: 29.99, stock: 3, description: 'UV400 polarized lenses in a lightweight frame. Includes a protective case.' },
  { name: 'Cotton Crew T-Shirt (3-Pack)', brand: 'Basics Co.', category: 'Fashion', emoji: '👕', price: 24.0, stock: 100, description: 'Soft 100% cotton crew-neck tees in black, white and grey.' },
  { name: 'Stainless Steel Water Bottle', brand: 'Hydra', category: 'Sports & Outdoors', emoji: '🥤', price: 19.99, stock: 75, featured: true, description: 'Double-walled insulated bottle keeps drinks cold for 24 hours or hot for 12. 750 ml.' },
  { name: 'Non-Slip Yoga Mat', brand: 'Zenflow', category: 'Sports & Outdoors', emoji: '🧘', price: 34.99, stock: 22, description: 'Extra-thick 6 mm yoga mat with a non-slip texture and carrying strap.' },
  { name: 'Adjustable Dumbbell Set', brand: 'IronCore', category: 'Sports & Outdoors', emoji: '🏋️', price: 119.0, stock: 8, description: 'Space-saving adjustable dumbbells from 2.5 to 24 kg each with a quick-select dial.' },
  { name: '2-Person Camping Tent', brand: 'Trailhead', category: 'Sports & Outdoors', emoji: '⛺', price: 89.99, compareAt: 109.99, stock: 10, description: 'Waterproof dome tent with easy setup, mesh ventilation and a rainfly.' },
  { name: 'Pour-Over Coffee Set', brand: 'Brewhouse', category: 'Home & Kitchen', emoji: '☕', price: 36.0, stock: 26, featured: true, description: 'Glass pour-over dripper, carafe and 100 paper filters for café-quality coffee at home.' },
  { name: 'Non-Stick Frying Pan 28cm', brand: 'Chef’s Choice', category: 'Home & Kitchen', emoji: '🍳', price: 32.5, stock: 35, description: 'Durable non-stick pan suitable for all stovetops including induction. Oven safe to 220°C.' },
  { name: 'Scented Soy Candle', brand: 'Hearth', category: 'Home & Kitchen', emoji: '🕯️', price: 16.99, stock: 50, description: 'Hand-poured soy wax candle with notes of vanilla and cedar. 45-hour burn time.' },
  { name: 'Indoor Plant Pot Set', brand: 'Greenery', category: 'Home & Kitchen', emoji: '🪴', price: 27.99, stock: 2, description: 'Set of three ceramic pots with drainage holes and bamboo saucers.' },
  { name: 'Clean Code', brand: 'Robert C. Martin', category: 'Books', emoji: '📘', price: 34.99, stock: 15, description: 'A handbook of agile software craftsmanship: principles, patterns and practices for writing clean code.' },
  { name: 'Atomic Habits', brand: 'James Clear', category: 'Books', emoji: '📗', price: 18.99, stock: 40, featured: true, description: 'An easy and proven way to build good habits and break bad ones.' },
  { name: 'The Pragmatic Programmer', brand: 'Hunt & Thomas', category: 'Books', emoji: '📕', price: 39.99, stock: 9, description: 'Your journey to mastery — timeless advice for software developers.' },
  { name: 'Hydrating Face Moisturizer', brand: 'Glow Lab', category: 'Beauty', emoji: '🧴', price: 22.0, stock: 45, description: 'Lightweight daily moisturizer with hyaluronic acid for all skin types. Fragrance free.' },
  { name: 'Vitamin C Serum', brand: 'Glow Lab', category: 'Beauty', emoji: '✨', price: 26.5, compareAt: 32.0, stock: 20, description: 'Brightening serum with 15% vitamin C and vitamin E. 30 ml.' },
];

// Past orders for the demo customer: [product index, qty][], status, days ago.
export const sampleOrders = [
  { items: [[0, 1], [4, 1]], status: 'delivered', daysAgo: 24 },
  { items: [[7, 1]], status: 'delivered', daysAgo: 18 },
  { items: [[15, 1], [17, 2]], status: 'shipped', daysAgo: 9 },
  { items: [[20, 1], [19, 1]], status: 'processing', daysAgo: 4 },
  { items: [[11, 2]], status: 'cancelled', daysAgo: 3 },
  { items: [[1, 1]], status: 'pending', daysAgo: 1 },
];
