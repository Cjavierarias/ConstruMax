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
        await this.loadProductsFromSheet();
        this.updateCartUI();

        // Solo generar productos destacados si estamos en index.html
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
        const isProductsPage = currentPath.includes('products.html');

        console.log('🔄 Inicializando página:', { currentPath, isIndexPage, isProductsPage });

        if (isIndexPage) {
            console.log('🏠 Página de inicio - Generando productos destacados');
            this.generateFeaturedProducts();
        }
        
        if (isProductsPage) {
            console.log('📦 Página de productos - Lista completa');
            // La generación de productos en products.html se maneja en su propio script
        }

        this.bindEvents();
    }

    async loadProductsFromSheet() {
        try {
            console.log('🔄 Cargando productos desde Google Sheet...');
            
            const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbw5JtLIQU5j-fj8fNO3iNfOQ3RO3pqmZMP2qFZ1RwpWl_4ZcyLIsNYQf_AgWEGx3I38/exec';
            
            const response = await fetch(WEBAPP_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.products && Array.isArray(data.products)) {
                this.products = data.products.map(product => {
                    const processedProduct = {
                        id: product.id || product.ID_Producto || '',
                        name: product.name || product.Nombre || '',
                        category: product.category || product.Categoría_Principal || '',
                        allCategories: product.allCategories || 
                                      (product.Todas_Categorías ? 
                                       (typeof product.Todas_Categorías === 'string' ? 
                                        product.Todas_Categorías.split(',').map(cat => cat.trim()) : 
                                        product.Todas_Categorías) : 
                                       [product.Categoría_Principal]),
                        featured: product.featured || product.Destacado === 'SI',
                        price: Number(product.price || product.Precio) || 0,
                        stock: Number(product.stock || product.Stock) || 0,
                        image: product.image || product['Imagen URL'] || 'resources/placeholder.jpg',
                        description: product.description || product.Descripción || '',
                        code: product.code || product.Código || '',
                        active: product.active !== undefined ? product.active : 
                               (product.Activo === 'SI' || product.Activo === true || product.Activo === '')
                    };

                    if (!Array.isArray(processedProduct.allCategories)) {
                        processedProduct.allCategories = [processedProduct.category];
                    }

                    return processedProduct;
                }).filter(product => product.active);

                console.log(`✅ ${this.products.length} productos cargados desde Sheet`);
                console.log('📊 Productos destacados:', this.products.filter(p => p.featured).length);
                
            } else {
                console.error('❌ Formato de respuesta inválido:', data);
                this.products = this.getDefaultProducts();
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.products = this.getDefaultProducts();
            console.log('🔄 Usando productos por defecto');
        }
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
                image: 'resources/taladro.jpg',
                description: 'Taladro percutor profesional con 650W de potencia',
                code: 'TLD-650',
                active: true
            },
            {
                id: 'martillo-002',
                name: 'Martillo Demoledor',
                category: 'herramientas',
                allCategories: ['herramientas', 'construccion'],
                featured: true,
                price: 45999,
                stock: 8,
                image: 'resources/martillo.jpg',
                description: 'Martillo demoledor 1500W para trabajos pesados',
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
                image: 'resources/cable.jpg',
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
                image: 'resources/sierra.jpg',
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
                image: 'resources/pintura.jpg',
                description: 'Pintura látex premium para interiores 20L',
                code: 'PTL-20',
                active: true
            }
        ];
    }

    generateFeaturedProducts() {
        const featuredContainer = document.getElementById('featured-products');
        if (!featuredContainer) {
            console.log('❌ No se encontró el contenedor de productos destacados');
            return;
        }

        const featuredProducts = this.products.filter(product => product.featured && product.stock > 0);
        
        console.log('🎯 Productos destacados encontrados:', featuredProducts.length);
        
        if (featuredProducts.length === 0) {
            featuredContainer.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay productos destacados</p>';
            return;
        }

        // Para el index.html con Swiper
        if (document.querySelector('.featured-swiper')) {
            this.generateFeaturedSwiper(featuredProducts);
        } else {
            // Para grid normal (fallback)
            featuredContainer.innerHTML = featuredProducts.map(product => {
                const imageUrl = product.image || 'resources/placeholder.jpg';
                const priceFormatted = new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS'
                }).format(product.price);

                return `
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <img src="${imageUrl}" alt="${product.name}" 
                             class="w-full h-32 object-cover rounded-t-lg"
                             onerror="this.src='resources/placeholder.jpg'">
                        <div class="p-3">
                            <h3 class="font-semibold text-sm mb-2 line-clamp-2">${product.name}</h3>
                            <div class="text-lg font-bold text-ml-dark-gray">${priceFormatted}</div>
                            <div class="text-xs text-green-600 mb-2">Envío gratis</div>
                            <button 
                                class="w-full bg-ml-blue text-white py-2 rounded-md text-sm font-semibold hover:bg-ml-dark-blue transition-colors"
                                onclick="addToCart('${product.id}')"
                                ${product.stock === 0 ? 'disabled' : ''}
                            >
                                ${product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    generateFeaturedSwiper(featuredProducts) {
        const swiperWrapper = document.querySelector('.featured-swiper .swiper-wrapper');
        if (!swiperWrapper) {
            console.log('❌ No se encontró el swiper wrapper');
            return;
        }

        swiperWrapper.innerHTML = featuredProducts.map(product => {
            const imageUrl = product.image || 'resources/placeholder.jpg';
            const priceFormatted = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS'
            }).format(product.price);

            const discount = product.featured && Math.random() > 0.7;
            const discountPercent = discount ? Math.floor(Math.random() * 30) + 10 : 0;
            const originalPrice = discount ? product.price * (1 + discountPercent/100) : null;

            return `
                <div class="swiper-slide">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full relative">
                        ${discount ? `<div class="promo-badge">${discountPercent}% OFF</div>` : ''}
                        <img src="${imageUrl}" alt="${product.name}" 
                             class="w-full h-48 object-cover rounded-lg mb-4"
                             onerror="this.src='resources/placeholder.jpg'">
                        <h3 class="font-semibold text-sm mb-2 line-clamp-2">${product.name}</h3>
                        <p class="text-xs text-gray-500 mb-3 line-clamp-2">${product.description}</p>
                        
                        ${discount ? `
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="text-lg font-bold text-ml-dark-gray">${priceFormatted}</span>
                                <span class="text-sm text-gray-500 line-through">$${originalPrice.toFixed(2)}</span>
                            </div>
                        ` : `
                            <div class="text-lg font-bold text-ml-dark-gray mb-2">${priceFormatted}</div>
                        `}
                        
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
            `;
        }).join('');

        console.log('✅ Swiper de productos destacados generado');
    }

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
                price: product.price
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
        return this.cart.reduce((total, item) => {
            const product = this.products.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
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
        // Implementación mejorada de toast
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
        
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    bindEvents() {
        // Eventos de búsqueda y filtros
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }
    }

    filterProducts(searchTerm) {
        // Implementación básica de filtrado
        const products = document.querySelectorAll('#products-grid > div');
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

    // Método para obtener productos para products.html
    getAllProducts() {
        return this.products;
    }

    // Método para obtener productos por categoría
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando ConstruMax App...');
    window.construmaxApp = new ConstruMaxApp();
});

// Funciones globales
function addToCart(productId) {
    if (window.construmaxApp) {
        window.construmaxApp.addToCart(productId);
    } else {
        console.error('❌ ConstruMax App no está inicializada');
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

// Función global para recargar productos
function refreshProducts() {
    if (window.construmaxApp) {
        window.construmaxApp.loadProductsFromSheet().then(() => {
            const currentPath = window.location.pathname;
            const isIndexPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
            
            if (isIndexPage) {
                window.construmaxApp.generateFeaturedProducts();
            }
            
            window.construmaxApp.showToast('Productos actualizados', 'success');
        });
    }
}
