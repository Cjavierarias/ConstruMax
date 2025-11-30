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
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            this.generateFeaturedProducts();
        }
        
        // Solo generar todos los productos si estamos en products.html
        if (window.location.pathname.includes('products.html')) {
            this.generateAllProducts();
        }

        
        this.generateFeaturedProducts();
        this.generateAllProducts();
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
            }
        ];
    }

    generateFeaturedProducts() {
        const featuredContainer = document.getElementById('featured-products');
        if (!featuredContainer) return;

        const featuredProducts = this.products.filter(product => product.featured && product.stock > 0);
        
        if (featuredProducts.length === 0) {
            featuredContainer.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay productos destacados</p>';
            return;
        }

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

    /* generateAllProducts() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay productos disponibles</p>';
            return;
        }

        productsGrid.innerHTML = this.products.map(product => {
            const imageUrl = product.image || 'resources/placeholder.jpg';
            const priceFormatted = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS'
            }).format(product.price);

            const stockStatus = product.stock > 10 ? 'text-green-600' : 
                              product.stock > 0 ? 'text-yellow-600' : 'text-red-600';
            const stockText = product.stock > 10 ? 'Disponible' : 
                            product.stock > 0 ? 'Últimas unidades' : 'Sin stock';

            return `
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <img src="${imageUrl}" alt="${product.name}" 
                         class="w-full h-40 object-cover rounded-t-lg"
                         onerror="this.src='resources/placeholder.jpg'">
                    <div class="p-3">
                        <h3 class="font-semibold text-sm mb-2 line-clamp-2">${product.name}</h3>
                        <p class="text-xs text-gray-500 mb-2">${product.description}</p>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-500">Código: ${product.code}</span>
                            <span class="text-xs ${stockStatus}">${stockText}</span>
                        </div>
                        <div class="text-lg font-bold text-ml-dark-gray mb-2">${priceFormatted}</div>
                        <div class="text-xs text-green-600 mb-3">Envío gratis</div>
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
    } */

    // Nuevo método para products.html
generateAllProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    if (this.products.length === 0) {
        productsGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay productos disponibles</p>';
        return;
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
        // Implementación simple de toast
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
            const name = product.querySelector('h3').textContent.toLowerCase();
            const description = product.querySelector('p').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.construmaxApp = new ConstruMaxApp();
});

// Funciones globales
function addToCart(productId) {
    window.construmaxApp.addToCart(productId);
}

function removeFromCart(productId) {
    window.construmaxApp.removeFromCart(productId);
}

function updateQuantity(productId, quantity) {
    window.construmaxApp.updateQuantity(productId, parseInt(quantity));
}

