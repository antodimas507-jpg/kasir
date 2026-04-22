let products = JSON.parse(localStorage.getItem('mpok_nani_products')) || [
    { id: 1, name: 'Nasi Campur', price: 25000 },
    { id: 2, name: 'Es Teh Manis', price: 5000 },
    { id: 3, name: 'Ayam Bakar Madu', price: 22000 },
    { id: 4, name: 'Gado-Gado Betawi', price: 12000 }
];

let cart = [];
let history = JSON.parse(localStorage.getItem('mpok_nani_history')) || [];

// Reset History if new day
const initToday = new Date().toLocaleDateString('id-ID');
const oldLength = history.length;
history = history.filter(h => h.date.startsWith(initToday));
if(history.length !== oldLength) {
    localStorage.setItem('mpok_nani_history', JSON.stringify(history));
}

// Migrate old data if necessary (variants -> simple price)
products = products.map(p => {
    if(p.variants && p.variants.length > 0) {
        p.price = p.variants[0].price;
        delete p.variants;
    }
    return p;
});

// Utilities
function formatRupiah(number) {
    return 'Rp ' + number.toLocaleString('id-ID');
}

function playFeedback() {
    try {
        if(navigator.vibrate) navigator.vibrate(50);
        if(window.beepObj) window.beepObj();
    } catch(e) {}
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        
        div.innerHTML = `
            <div class="product-info-text">
                <div class="product-name">${p.name}</div>
                <div class="product-price">${formatRupiah(p.price)}</div>
            </div>
            <div class="product-actions mt-10">
                <button class="btn-edit-product" onclick="editMenu(${p.id})" title="Ubah Menu">✏️</button>
                <button class="btn-add" onclick="handleAddClick(${p.id})">
                    <span style="font-size:12px; margin-right:5px">➕</span> TAMBAH
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function handleAddClick(id) {
    playFeedback();
    const product = products.find(p => p.id === id);
    if (!product) return;
    addToCart(product);
}

// Tambah/Ubah Menu Feature
function openAddMenu() {
    playFeedback();
    document.getElementById('addMenuModalTitle').innerText = "TAMBAH MENU BARU";
    document.getElementById('editMenuId').value = "";
    document.getElementById('btnDeleteMenu').style.display = 'none';
    document.getElementById('addMenuModal').classList.add('show');
}
function editMenu(id) {
    playFeedback();
    const product = products.find(p => p.id === id);
    if(!product) return;
    
    document.getElementById('addMenuModalTitle').innerText = "UBAH MENU";
    document.getElementById('editMenuId').value = id;
    document.getElementById('menuName').value = product.name;
    document.getElementById('menuPrice').value = product.price || '';
    document.getElementById('btnDeleteMenu').style.display = 'block';
    
    document.getElementById('addMenuModal').classList.add('show');
}
function closeAddMenu() {
    playFeedback();
    document.getElementById('addMenuModal').classList.remove('show');
    clearAddMenuForm();
}
function clearAddMenuForm() {
    document.getElementById('menuName').value = '';
    document.getElementById('menuPrice').value = '';
}

function saveNewMenu() {
    playFeedback();
    const name = document.getElementById('menuName').value.trim();
    const priceStr = document.getElementById('menuPrice').value;
    const price = parseInt(priceStr);

    if(!name) return alert("Nama menu harus diisi!");
    if(isNaN(price) || price < 0) return alert("Harga tidak valid!");

    const editId = document.getElementById('editMenuId').value;
    const newMenuItem = {
        id: editId ? parseInt(editId) : Date.now(),
        name: name,
        price: price
    };

    finishSavingMenu(newMenuItem);
}

function finishSavingMenu(item) {
    const editId = document.getElementById('editMenuId').value;
    if (editId) {
        const index = products.findIndex(p => p.id == parseInt(editId));
        if(index !== -1) products[index] = item;
    } else {
        products.push(item);
    }
    localStorage.setItem('mpok_nani_products', JSON.stringify(products));
    renderProducts();
    closeAddMenu();
}

function deleteMenu() {
    playFeedback();
    const editId = document.getElementById('editMenuId').value;
    if(!editId) return;
    
    if(confirm("Yakin ingin menghapus menu ini?")) {
        products = products.filter(p => p.id != editId);
        cart = cart.filter(i => i.id != editId);
        
        localStorage.setItem('mpok_nani_products', JSON.stringify(products));
        updateCart();
        renderProducts();
        closeAddMenu();
    }
}

// Cart Logic
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ 
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.img,
            qty: 1 
        });
    }
    
    const badge = document.getElementById('cartBadge');
    badge.style.display = 'flex';
    badge.classList.add('shake');
    setTimeout(() => badge.classList.remove('shake'), 300);
    
    updateCart();
}

function changeQty(id, delta) {
    playFeedback();
    const item = cart.find(i => i.id === id);
    if(item) {
        item.qty += delta;
        if(item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    updateCart();
}

function clearCart() {
    playFeedback();
    if(confirm('Kosongkan barisan belanja?')) {
        cart = [];
        updateCart();
    }
}

function updateCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartBadge');
    if(totalQty > 0) {
        badge.style.display = 'flex';
        badge.innerText = totalQty;
    } else {
        badge.style.display = 'none';
    }

    const list = document.getElementById('cartList');
    list.innerHTML = '';
    
    if(cart.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 30px; font-weight:800; color:#888;">KERANJANG KOSONG</div>';
    }

    let totalHarga = 0;
    cart.forEach(item => {
        totalHarga += item.price * item.qty;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatRupiah(item.price)}</div>
            </div>
            <div class="cart-item-qty">
                <button class="btn-qty minus" onclick="changeQty(${item.id}, -1)">−</button>
                <div class="qty-number">${item.qty}</div>
                <button class="btn-qty plus" onclick="changeQty(${item.id}, 1)">+</button>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('cartTotalText').innerText = formatRupiah(totalHarga);
    window.currentTotal = totalHarga;
    
    generateQuickMoneyButtons(totalHarga);
    calculateReturn();
}

function generateQuickMoneyButtons(total) {
    const quickButtons = document.getElementById('quickMoneyButtons');
    quickButtons.innerHTML = `
        <button class="btn-quick" onclick="setUang(${total})">UANG PAS</button>
        <button class="btn-quick" onclick="setUang(5000)">Rp 5.000</button>
        <button class="btn-quick" onclick="setUang(10000)">Rp 10.000</button>
        <button class="btn-quick" onclick="setUang(20000)">Rp 20.000</button>
        <button class="btn-quick" onclick="setUang(50000)">Rp 50.000</button>
        <button class="btn-quick" onclick="setUang(100000)">Rp 100.000</button>
    `;
}

function setUang(nominal) {
    playFeedback();
    document.getElementById('uangDiterima').value = nominal;
    calculateReturn();
}

function calculateReturn() {
    const input = document.getElementById('uangDiterima').value;
    const uang = parseInt(input) || 0;
    const total = window.currentTotal;
    const kembalian = uang - total;
    
    const spanKembalian = document.getElementById('kembalianText');
    if (total === 0) {
         spanKembalian.innerText = "Rp 0";
         spanKembalian.style.color = "var(--panel-black)";
    } else if (kembalian < 0) {
        spanKembalian.innerText = "KURANG";
        spanKembalian.style.color = "red";
    } else {
        spanKembalian.innerText = formatRupiah(kembalian);
        spanKembalian.style.color = "var(--panel-black)";
    }
}

document.getElementById('uangDiterima').addEventListener('input', calculateReturn);

function finishTransaction() {
    playFeedback();
    if(cart.length === 0) return alert("Keranjang masih kosong!");
    
    const uang = parseInt(document.getElementById('uangDiterima').value) || 0;
    if (uang < window.currentTotal) {
        return alert("Maaf, uang tunai kurang!");
    }

    const trans = {
        date: new Date().toLocaleString('id-ID'),
        total: window.currentTotal,
        items: [...cart],
        pay: uang,
        change: uang - window.currentTotal
    };
    history.push(trans);
    localStorage.setItem('mpok_nani_history', JSON.stringify(history));

    cart = [];
    document.getElementById('uangDiterima').value = '';
    updateCart();
    renderHistory();
    switchTab('riwayat');
}

// History & Export
function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    
    const today = new Date().toLocaleDateString('id-ID');
    let todayTotal = 0;

    const reversed = [...history].reverse();

    reversed.forEach((h, index) => {
        const isToday = h.date.startsWith(today);
        if(isToday) todayTotal += h.total;

        const div = document.createElement('div');
        div.className = 'history-card';
        
        let datetimeStr = h.date.split(',');
        let dDate = datetimeStr[0] || '';
        let dTime = datetimeStr[1] ? datetimeStr[1].trim() + ' WIB' : '';

        div.innerHTML = `
            <div class="history-header">
                <div class="history-date">
                    <span>📅 ${dDate}</span>
                    <span>🕒 ${dTime}</span>
                </div>
                <div class="badge-berhasil">BERHASIL</div>
            </div>
            <div class="history-total">
                <span style="color:#666">Total Harga:</span>
                <span class="history-total-val">${formatRupiah(h.total)}</span>
            </div>
            <button class="btn-detail" onclick="alert('Item Dibeli: \\n' + '${h.items.map(i=> i.qty+'x '+i.name).join('\\n')}')">
                <span style="font-size:12px">🧾</span> LIHAT DETAIL
            </button>
        `;
        list.appendChild(div);
    });

    document.getElementById('todayIncome').innerText = 'Pendapatan Hari Ini: ' + formatRupiah(todayTotal);
}

function exportData() {
    playFeedback();
    if(history.length === 0) {
       alert("Belum ada riwayat penjualan hari ini!");
       return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Waktu,Total,Bayar,Kembalian,Barang\n";
    history.forEach(function(row) {
        // Gabungkan nama barang
        const itemStr = row.items.map(i => i.qty + 'x ' + i.name).join(' | ');
        // Ambil elemen CSV, ganti koma dengan titik koma jika ada di dalam nama item agar tidak bentrok
        let csvRow = [
            row.date.replace(/,/g, ''), 
            row.total, 
            row.pay, 
            row.change, 
            itemStr
        ].join(",");
        csvContent += csvRow + "\r\n";
    });
    
    // Auto download CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Tambah tanggal di nama file
    const today = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    link.setAttribute("download", "Laporan_Jualan_" + today + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Tabbing System
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    const btns = document.querySelectorAll('.nav-btn');
    if(tabId === 'jualan') { btns[0].classList.add('active'); document.getElementById('posBadge').style.display='none'; document.getElementById('btnSearch').style.display='block'; document.getElementById('btnOpenAddMenu').style.display='flex'; }
    if(tabId === 'keranjang') { btns[1].classList.add('active'); document.getElementById('posBadge').style.display='block'; document.getElementById('btnSearch').style.display='none'; document.getElementById('btnOpenAddMenu').style.display='none';}
    if(tabId === 'riwayat') { btns[2].classList.add('active'); document.getElementById('posBadge').style.display='none'; document.getElementById('btnSearch').style.display='block'; document.getElementById('btnOpenAddMenu').style.display='none';}

    window.scrollTo(0,0);
}

// Init
window.onload = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    window.beepObj = function() {
        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            oscillator.start();
            setTimeout(() => oscillator.stop(), 50);
        } catch(e){}
    }

    renderProducts();
    updateCart();
    renderHistory();
};
