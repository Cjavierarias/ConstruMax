// ConstruMax Web App - Main JavaScript
class ConstruMaxApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('construmax_cart')) || [];
        this.products = [];
        this.categories = this.getCategories();
        this.init();
    }

    getCategories() {
        return [
            'todos',
            'herramientas',
            'electricidad',
            'fontaneria',
            'construccion',
            'seguridad',
            'jardin',
            'iluminacion',
            'tornilleria',
            'pinturas',
            'plasticos',
            'madera'
        ];
    }

    async init() {
        console.log('🚀 Iniciando ConstruMax App...');
        await this.loadProductsFromSheet();
        this.updateCartUI();
        this.setupPage();
        this.bindEvents();
    }

    async loadProductsFromSheet() {
        try {
            console.log('📦 Cargando productos...');
            
            // Primero cargar productos por defecto inmediatamente
            this.products = this.getDefaultProducts();
            
            // Luego intentar cargar desde Google Sheets
            const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbw5JtLIQU5j-fj8fNO3iNfOQ3RO3pqmZMP2qFZ1RwpWl_4ZcyLIsNYQf_AgWEGx3I38/exec';
            
            const response = await fetch(WEBAPP_URL);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.products && Array.isArray(data.products)) {
                    this.products = data.products.map(product => ({
                        id: product.id || product.ID_Producto || '',
                        name: product.name || product.Nombre || '',
                        category: product.category || product.Categoría_Principal || '',
                        allCategories: Array.isArray(product.allCategories) ? product.allCategories : 
                                      (product.Todas_Categorías ? 
                                       (typeof product.Todas_Categorías === 'string' ? 
                                        product.Todas_Categorías.split(',').map(cat => cat.trim()) : 
                                        [product.Todas_Categorías]) : 
                                       [product.Categoría_Principal]),
                        featured: product.featured || product.Destacado === 'SI',
                        price: Number(product.price || product.Precio) || 0,
                        stock: Number(product.stock || product.Stock) || 0,
                        image: product.image || product['Imagen URL'] || 'resources/placeholder.jpg',
                        description: product.description || product.Descripción || '',
                        code: product.code || product.Código || '',
                        active: product.active !== undefined ? product.active : true
                    })).filter(product => product.active);

                    console.log('✅ Productos cargados desde Sheet:', this.products.length);
                }
            }
            
        } catch (error) {
            console.log('⚠️ Usando productos por defecto:', error);
            this.products = this.getDefaultProducts();
        }

        console.log('📊 Total de productos:', this.products.length);
        console.log('⭐ Productos destacados:', this.products.filter(p => p.featured).length);
    }

    getDefaultProducts() {
        return [
            {
                id: 'taladro-001',
                name: 'Taladro Percutor 650W',
                category: 'herramientas',
                allCategories: ['herramientas', 'electricidad'],
                featured: true,
                price: 25999,
                stock: 15,
                image: 'https://images.unsplash.com/photo-1572981779307-38f8b0456222?w=300',
                description: 'Taladro percutor profesional con 650W de potencia',
                code: 'TLD-650',
                active: true
            },
            {
                id: 'martillo-002',
                name: 'Martillo Demoledor 1500W',
                category: 'herramientas',
                allCategories: ['herramientas', 'construccion'],
                featured: true,
                price: 45999,
                stock: 8,
                image: 'https://images.unsplash.com/photo-1581093458791-8a6a5d49414a?w=300',
                description: 'Martillo demoledor profesional para trabajos pesados',
                code: 'MRT-D1500',
                active: true
            },
            {
                id: 'cable-003',
                name: 'Cable Eléctrico 2.5mm',
                category: 'electricidad',
                allCategories: ['electricidad'],
                featured: false,
                price: 8999,
                stock: 50,
                image: 'https://images.unsplash.com/photo-1581093458791-8a6a5d49414a?w=300',
                description: 'Cable eléctrico THHN 2.5mm x 100m',
                code: 'CBL-250',
                active: true
            },
            {
                id: 'sierra-004',
                name: 'Sierra Circular 1800W',
                category: 'herramientas',
                allCategories: ['herramientas', 'construccion'],
                featured: true,
                price: 32999,
                stock: 12,
                image: 'https://images.unsplash.com/photo-1572981779307-38f8b0456222?w=300',
                description: 'Sierra circular profesional con láser guía',
                code: 'SRC-1800',
                active: true
            },
            {
                id: 'pintura-005',
                name: 'Pintura Látex Interior',
                category: 'pinturas',
                allCategories: ['pinturas', 'construccion'],
                featured: true,
                price: 15999,
                stock: 25,
                image: 'https://images.unsplash.com/photo-1581093458791-8a6a5d49414a?w=300',
                description: 'Pintura látex premium para interiores 20L',
                code: 'PTL-20',
                active: true
            },
            {
                id: 'destornillador-006',
                name: 'Juego Destornilladores',
                category: 'herramientas',
                allCategories: ['herramientas'],
                featured: false,
                price: 12999,
                stock: 30,
                image: 'https://images.unsplash.com/photo-1572981779307-38f8b0456222?w=300',
                description: 'Set de 12 destornilladores profesionales',
                code: 'DST-12',
                active: true
            }
        ];
    }

    setupPage() {
        const path = window.location.pathname;
        
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            this.setupHomePage();
        } else if (path.includes('products.html')) {
            this.setupProductsPage();
        }
    }

    setupHomePage() {
        console.log('🏠 Configurando página de inicio');
        this.generateFeaturedProducts();
    }

    setupProductsPage() {
        console.log('📦 Configurando página de productos');
        // La página products.html maneja su propia lógica
    }

    generateFeaturedProducts() {
        console.log('🎯 Generando productos destacados...');
        
        const featuredProducts = this.products.filter(product => 
            product.featured && product.stock > 0
        );
        
        console.log('⭐ Productos destacados encontrados:', featuredProducts.length);

        // Para el carrusel Swiper
        const swiperWrapper = document.querySelector('.featured-swiper .swiper-wrapper');
        if (swiperWrapper) {
            this.generateSwiperProducts(featuredProducts, swiperWrapper);
        }

        // Para grid normal (fallback)
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer && !swiperWrapper) {
            this.generateGridProducts(featuredProducts, featuredContainer);
        }
    }

    generateSwiperProducts(products, wrapper) {
        if (products.length === 0) {
            wrapper.innerHTML = `
                <div class="swiper-slide">
                    <div class="text-center py-8">
                        <p class="text-gray-500">No hay productos destacados</p>
                    </div>
                </div>
            `;
            return;
        }

        wrapper.innerHTML = products.map(product => `
            <div class="swiper-slide">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full relative">
                    <div class="promo-badge">Destacado</div>
                    <img src="${product.image}" alt="${product.name}" 
                         class="w-full h-48 object-cover rounded-lg mb-4"
                         onerror="this.src='resources/placeholder.jpg'">
                    <h3 class="font-semibold text-sm mb-2 line-clamp-2">${product.name}</h3>
                    <p class="text-xs text-gray-500 mb-3 line-clamp-2">${product.description}</p>
                    <div class="text-lg font-bold text-ml-dark-gray mb-2">
                        $${product.price.toLocaleString('es-AR')}
                    </div>
                    <div class="text-xs text-ml-green mb-3">Envío gratis</div>
                    <button 
                        class="w-full bg-ml-blue text-white py-2 rounded-md text-sm font-semibold hover:bg-ml-dark-blue transition-colors"
                        onclick="addToCart('${product.id}')"
                        ${product.stock === 0 ? 'disabled' : ''}
                    >
                        ${product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        `).join('');

        // Inicializar Swiper si existe
        if (typeof Swiper !== 'undefined') {
            new Swiper('.featured-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                },
            });
        }
    }

    generateGridProducts(products, container) {
        if (products.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay productos destacados</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <img src="${product.image}" alt="${product.name}" 
                     class="w-full h-48 object-cover rounded-t-lg"
                     onerror="this.src='resources/placeholder.jpg'">
                <div class="p-4">
                    <h3 class="font-semibold text-sm mb-2">${product.name}</h3>
                    <p class="text-xs text-gray-500 mb-2">${product.description}</p>
                    <div class="text-lg font-bold text-ml-dark-gray mb-2">
                        $${product.price.toLocaleString('es-AR')}
                    </div>
                    <div class="text-xs text-ml-green mb-3">Envío gratis</div>
                    <button 
                        class="w-full bg-ml-blue text-white py-2 rounded-md text-sm font-semibold hover:bg-ml-dark-blue transition-colors"
                        onclick="addToCart('${product.id}')"
                        ${product.stock === 0 ? 'disabled' : ''}
                    >
                        ${product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Métodos del carrito
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showToast('Producto no encontrado', 'error');
            return false;
        }

        if (product.stock < quantity) {
            this.showToast(`Stock insuficiente. Solo quedan ${product.stock} unidades`, 'error');
            return false;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            if (existingItem.quantity + quantity > product.stock) {
                this.showToast(`No puedes agregar más. Stock máximo: ${product.stock}`, 'error');
                return false;
            }
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId: productId,
                quantity: quantity,
                price: product.price,
                name: product.name,
                image: product.image
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showToast(`${product.name} agregado al carrito`, 'success');
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartUI();
        this.showToast('Producto eliminado del carrito', 'success');
    }

    updateQuantity(productId, quantity) {
        const product = this.products.find(p => p.id === productId);
        const item = this.cart.find(item => item.productId === productId);
        
        if (item && product) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else if (quantity > product.stock) {
                this.showToast(`No puedes agregar más. Stock máximo: ${product.stock}`, 'error');
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('construmax_cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const count = this.getCartItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    bindEvents() {
        // Búsqueda en tiempo real
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }
    }

    filterProducts(searchTerm) {
        const products = document.querySelectorAll('.product-card');
        const term = searchTerm.toLowerCase();
        
        products.forEach(product => {
            const name = product.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = product.querySelector('p')?.textContent.toLowerCase() || '';
            
            if (name.includes(term) || description.includes(term)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }

    // Métodos de utilidad
    getAllProducts() {
        return this.products;
    }

    getProductsByCategory(category) {
        if (category === 'todos') {
            return this.products;
        }
        return this.products.filter(product => 
            product.allCategories.includes(category) && product.stock > 0
        );
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado - Inicializando app...');
    window.construmaxApp = new ConstruMaxApp();
});

// Funciones globales para HTML
function addToCart(productId) {
    if (window.construmaxApp) {
        window.construmaxApp.addToCart(productId);
    } else {
        console.error('❌ App no inicializada');
        // Fallback: agregar directamente al localStorage
        const cart = JSON.parse(localStorage.getItem('construmax_cart')) || [];
        const existing = cart.find(item => item.productId === productId);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                productId: productId,
                quantity: 1,
                price: 0,
                name: 'Producto',
                image: 'resources/placeholder.jpg'
            });
        }
        
        localStorage.setItem('construmax_cart', JSON.stringify(cart));
        
        // Actualizar UI
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Mostrar toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 bg-green-500 text-white';
        toast.textContent = 'Producto agregado al carrito';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

function removeFromCart(productId) {
    if (window.construmaxApp) {
        window.construmaxApp.removeFromCart(productId);
    }
}

function updateQuantity(productId, quantity) {
    if (window.construmaxApp) {
        window.construmaxApp.updateQuantity(productId, parseInt(quantity));
    }
}

// Función para recargar productos
function refreshProducts() {
    if (window.construmaxApp) {
        window.construmaxApp.loadProductsFromSheet().then(() => {
            window.construmaxApp.setupPage();
            window.construmaxApp.showToast('Productos actualizados', 'success');
        });
    }
}
