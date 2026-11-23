/* ==========================================================================
   Body Scent — script.js
   ใช้ร่วมกันทุกหน้า: แต่ละส่วนจะทำงานเฉพาะเมื่อพบ element ของหน้านั้นๆ
   - product.html : #filter-bar, #product-list
   - order.html   : #orderForm, #customerName, #contact, #items, #total, #note
   - admin.html   : #ordersTable (tbody)
   ========================================================================== */

(function () {
  'use strict';

  var VALID_MOODS = ['fresh', 'sweet', 'confident', 'romance'];

  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQf0Sqo2E10YOhHaEYmsuzY7ecTfkui0Xxio-79h5kmdxQulXHeTJqR6qD86K-nb7TDa5I3DB72HbNY/pub?gid=0&single=true&output=csv';

  /* ------------------------------------------------------------------------
     1) หน้า product.html
     ------------------------------------------------------------------------ */
  function initProductPage() {
    var filterBar = document.getElementById('filter-bar');
    var productList = document.getElementById('product-list');
    if (!filterBar || !productList) { return; }

    var emptyMessage = document.getElementById('empty-message'); // ไม่บังคับ
    var filterButtons = filterBar.querySelectorAll('button');
    var products = [];

    function showMessage(text) {
      if (emptyMessage) {
        emptyMessage.textContent = text;
        emptyMessage.hidden = false;
      } else {
        productList.textContent = text;
      }
    }

    function hideMessage() {
      if (emptyMessage) { emptyMessage.hidden = true; }
    }

    function buildCard(product) {
      var fullName = product.size ? product.name + ' ' + product.size : product.name;

      var card = document.createElement('article');
      card.className = 'product-card';
      card.setAttribute('data-mood', product.mood);

      var imageWrap = document.createElement('div');
      imageWrap.className = 'product-card__image';
      var img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;
      img.loading = 'lazy';
      img.onerror = function () { img.style.visibility = 'hidden'; };
      imageWrap.appendChild(img);

      var body = document.createElement('div');
      body.className = 'product-card__body';

      var name = document.createElement('h3');
      name.className = 'product-card__name';
      name.textContent = product.name;

      var meta = document.createElement('p');
      meta.className = 'product-card__meta';
      meta.textContent = product.size ? 'ขนาด ' + product.size : '';

      var footer = document.createElement('div');
      footer.className = 'product-card__footer';

      var price = document.createElement('span');
      price.className = 'price';
      price.textContent = product.price;
      var unit = document.createElement('small');
      unit.textContent = 'บาท';
      price.appendChild(unit);

      var order = document.createElement('a');
      order.className = 'btn btn--accent';
      order.textContent = 'สั่งซื้อ';
      order.href = 'order.html?item=' + encodeURIComponent(fullName) +
                   '&price=' + encodeURIComponent(product.price);

      footer.appendChild(price);
      footer.appendChild(order);
      body.appendChild(name);
      body.appendChild(meta);
      body.appendChild(footer);
      card.appendChild(imageWrap);
      card.appendChild(body);
      return card;
    }

    function render(mood) {
      productList.innerHTML = '';
      hideMessage();

      var list = products.filter(function (p) {
        return mood === 'all' || p.mood === mood;
      });

      if (list.length === 0) {
        showMessage('ยังไม่มีสินค้าในหมวดนี้');
        return;
      }
      list.forEach(function (p) { productList.appendChild(buildCard(p)); });
    }

    function setFilter(mood, updateUrl) {
      filterButtons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === mood ? 'true' : 'false');
      });
      render(mood);

      if (updateUrl && window.history && history.replaceState) {
        var url = mood === 'all' ? 'product.html' : 'product.html?mood=' + mood;
        history.replaceState(null, '', url);
      }
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setFilter(btn.getAttribute('data-filter'), true);
      });
    });

    fetch('products.json')
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (data) {
        products = data;
        var param = (new URLSearchParams(window.location.search).get('mood') || '').toLowerCase();
        setFilter(VALID_MOODS.indexOf(param) !== -1 ? param : 'all', false);
      })
      .catch(function (error) {
        console.error(error);
        showMessage('โหลดข้อมูลสินค้าไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง');
      });
  }

  /* ------------------------------------------------------------------------
     2) หน้า order.html
     ------------------------------------------------------------------------ */
  function initOrderPage() {
    var form = document.getElementById('orderForm');
    if (!form) { return; }

    var itemsInput = document.getElementById('items');
    var totalInput = document.getElementById('total');

    // เติม item และ price จาก URL ลงทั้งสองช่องทันทีที่โหลดหน้า
    var params = new URLSearchParams(window.location.search);
    var item = params.get('item');
    var price = params.get('price');

    if (item && itemsInput) { itemsInput.value = item; }
    if (price && totalInput) { totalInput.value = price; }

    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var payload = {
        customerName: document.getElementById('customerName').value,
        contact: document.getElementById('contact').value,
        items: document.getElementById('items').value,
        total: document.getElementById('total').value,
        note: document.getElementById('note').value
      };

      if (submitBtn) { submitBtn.disabled = true; }

      fetch('https://script.google.com/macros/s/AKfycby7uz_mgEKavWTxXHh7FQjmkbc1HZ7POoOdeJu2vjI4JwnspsyD5sBLwz27trA0xxGsWQ/exec', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => { window.location.href = 'thankyou.html'; })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) { submitBtn.disabled = false; }
      });
    });
  }

  /* ------------------------------------------------------------------------
     3) หน้า admin.html
     ------------------------------------------------------------------------ */

  // parse CSV แบบเขียนเอง (RFC 4180): รองรับ "..." ที่มี comma/ขึ้นบรรทัดใหม่ และ "" แทน "
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var i = 0;

    if (text.charCodeAt(0) === 0xFEFF) { text = text.slice(1); }

    while (i < text.length) {
      var ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false;
          i++;
          continue;
        }
        field += ch;
        i++;
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r' || ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        if (ch === '\r' && text[i + 1] === '\n') { i++; }
        i++;
      } else {
        field += ch;
        i++;
      }
    }

    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function initAdminPage() {
    var tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) { return; }

    var statusEl = document.getElementById('status');       // ไม่บังคับ
    var reloadBtn = document.getElementById('reload-btn');  // ไม่บังคับ

    function setStatus(text) {
      if (statusEl) { statusEl.textContent = text; }
    }

    function showRowMessage(text) {
      tbody.innerHTML = '';
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'text-center text-muted';
      td.textContent = text;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    function renderRows(rows) {
      tbody.innerHTML = '';
      rows.forEach(function (row) {
        var tr = document.createElement('tr');
        for (var c = 0; c < 6; c++) {
          var td = document.createElement('td');
          td.textContent = row[c] !== undefined ? row[c] : '';
          if (c === 0) { td.className = 'time'; }
          if (c === 4) { td.className = 'num'; }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }

    function loadOrders() {
      setStatus('กำลังโหลดข้อมูล...');
      if (reloadBtn) { reloadBtn.disabled = true; }

      fetch(CSV_URL)
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          return res.text();
        })
        .then(function (text) {
          var rows = parseCSV(text).filter(function (row) {
            return !row.every(function (cell) { return cell.trim() === ''; });
          });

          // ข้ามแถวหัวคอลัมน์ ถ้าคอลัมน์ A ไม่มีตัวเลขเลย (ไม่ใช่วันที่)
          if (rows.length > 0 && !/\d/.test(rows[0][0])) { rows.shift(); }

          // appendRow ต่อท้ายตามเวลา จึงกลับลำดับให้ล่าสุดขึ้นก่อน
          rows.reverse();

          if (rows.length === 0) {
            showRowMessage('ยังไม่มีรายการสั่งซื้อ');
            setStatus('ทั้งหมด 0 รายการ');
          } else {
            renderRows(rows);
            setStatus('ทั้งหมด ' + rows.length + ' รายการ (ล่าสุดอยู่บนสุด)');
          }
        })
        .catch(function (error) {
          console.error(error);
          showRowMessage('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
          setStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        })
        .then(function () {
          if (reloadBtn) { reloadBtn.disabled = false; }
        });
    }

    if (reloadBtn) { reloadBtn.addEventListener('click', loadOrders); }
    loadOrders();
  }

  /* ------------------------------------------------------------------------
     เริ่มทำงาน
     ------------------------------------------------------------------------ */
  function init() {
    initProductPage();
    initOrderPage();
    initAdminPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
