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
        await this.loadProducts();
        this.updateCartUI();
        this.setupPage();
    }

    async loadProducts() {
        try {
            console.log('📦 Cargando productos...');
            
            // Primero cargar productos por defecto inmediatamente
            this.products = this.getDefaultProducts();
            this.renderFeaturedProducts();
            
            // Luego intentar cargar desde Google Sheets
            const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbw5JtLIQU5j-fj8fNO3iNfOQ3RO3pqmZMP2qFZ1RwpWl_4ZcyLIsNYQf_AgWEGx3I38/exec';
            
            const response = await fetch(WEBAPP_URL);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.products && Array.isArray(data.products)) {
                    this.products = data.products.map(product => ({
                        id: product.id || product.ID_Producto || Math.random().toString(36).substr(2, 9),
                        name: product.name || product.Nombre || 'Producto sin nombre',
                        category: product.category || product.Categoría_Principal || 'herramientas',
                        allCategories: Array.isArray(product.allCategories) ? product.allCategories : 
                                      (product.Todas_Categorías ? 
                                       (typeof product.Todas_Categorías === 'string' ? 
                                        product.Todas_Categorías.split(',').map(cat => cat.trim()) : 
                                        [product.Todas_Categorías]) : 
                                       [product.Categoría_Principal]),
                        featured: product.featured || product.Destacado === 'SI',
                        price: Number(product.price || product.Precio) || 0,
                        stock: Number(product.stock || product.Stock) || 0,
                        image: product.image || product['Imagen URL'] || this.getRandomToolImage(),
                        description: product.description || product.Descripción || 'Descripción no disponible',
                        code: product.code || product.Código || 'SN',
                        active: product.active !== undefined ? product.active : true
                    })).filter(product => product.active);

                    console.log('✅ Productos cargados desde Sheet:', this.products.length);
                    this.renderFeaturedProducts();
                }
            }
            
        } catch (error) {
            console.log('⚠️ Error cargando productos, usando datos locales:', error);
            this.products = this.getDefaultProducts();
            this.renderFeaturedProducts();
        }

        console.log('📊 Total de productos:', this.products.length);
        console.log('⭐ Productos destacados:', this.products.filter(p => p.featured).length);
    }

    getRandomToolImage() {
        const images = [
            'https://images.unsplash.com/photo-1572981779307-38f8b0456222?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1581093458791-8a6a5d49414a?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1581093456886-8b8d2745fdd4?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1581093459663-851309796b0c?w=400&h=300&fit=crop'
        ];
        return images[Math.floor(Math.random() * images.length)];
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
                image: 'https://images.unsplash.com/photo-1572981779307-38f8b0456222?w=400&h=300&fit=crop',
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
                image: 'https://images.unsplash.com/photo-1581093458791-8a6a5d49414a?w=400&h=300&fit=crop',
                description: 'Martillo demoledor profesional para trabajos pesados',
                code: 'MRT-D1500',
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
                image: 'https://images.unsplash.com/photo-1581093456886-8b8d2745fdd4?w=400&h=300&fit=crop',
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
                image: 'https://images.unsplash.com/photo-1581093459663-851309796b0c?w=400&h=300&fit=crop',
                description: 'Pintura látex premium para interiores 20L',
                code: 'PTL-20',
                active: true
            }
        ];
    }

    setupPage() {
        console.log('🏠 Configurando página de inicio');
        this.renderFeaturedProducts();
    }

    renderFeaturedProducts() {
        console.log('🎯 Renderizando productos destacados...');
        
        const featuredProducts = this.products.filter(product => 
            product.featured && product.stock > 0
        );
        
        console.log('⭐ Productos destacados encontrados:', featuredProducts.length);

        // Para el carrusel Swiper
        const swiperWrapper = document.querySelector('.featured-swiper .swiper-wrapper');
        if (swiperWrapper) {
            this.renderSwiperProducts(featuredProducts, swiperWrapper);
            this.initSwiper();
        }
    }

    renderSwiperProducts(products, wrapper) {
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
                         onerror="this.src='${this.getRandomToolImage()}'">
                    <h3 class="font-semibold text-sm mb-2 line-clamp-2">${product.name}</h3>
                    <p class="text-xs text-gray-500 mb-3 line-clamp-2">${product.description}</p>
                    <div class="text-lg font-bold text-ml-dark-gray mb-2">
                        $${product.price.toLocaleString('es-AR')}
                    </div>
                    <div class="text-xs text-ml-green mb-3">Envío gratis</div>
                    <button 
                        class="w-full bg-ml-blue text-white py-2 rounded-md text-sm font-semibold hover:bg-ml-dark-blue transition-colors add-to-cart-btn"
                        data-product-id="${product.id}"
                        ${product.stock === 0 ? 'disabled' : ''}
                    >
                        ${product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        `).join('');

        // Agregar event listeners a los botones
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
            });
        });
    }

    initSwiper() {
        if (typeof Swiper === 'undefined') {
            console.log('⚠️ Swiper no está disponible');
            return;
        }

        try {
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
                    640: { 
                        slidesPerView: 2,
                        spaceBetween: 20
                    },
                    768: { 
                        slidesPerView: 3,
                        spaceBetween: 20
                    },
                    1024: { 
                        slidesPerView: 4,
                        spaceBetween: 20
                    },
                },
            });
            console.log('✅ Swiper inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Swiper:', error);
        }
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
        // Eliminar toasts existentes
        document.querySelectorAll('.custom-toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `custom-toast fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
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
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    console.log('🚀 Inicializando ConstruMax App...');
    window.construmaxApp = new ConstruMaxApp();
}

// Función global para recargar productos
function refreshProducts() {
    if (window.construmaxApp) {
        window.construmaxApp.loadProducts();
        window.construmaxApp.showToast('Productos actualizados', 'success');
    }
}
