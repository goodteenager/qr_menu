const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
}

const params = new URLSearchParams(window.location.search);
const tableNumber = params.get("table") || "?";

const MENU = [
  {
    id: "pizza",
    title: "Пицца",
    items: [
      { id: "pizza_margherita", title: "Маргарита", price: 450 },
      { id: "pizza_pepperoni", title: "Пепперони", price: 520 },
      { id: "pizza_four_cheese", title: "Четыре сыра", price: 580 },
    ],
  },
  {
    id: "pasta",
    title: "Паста",
    items: [
      { id: "pasta_carbonara", title: "Карбонара", price: 430 },
      { id: "pasta_bolognese", title: "Болоньезе", price: 440 },
    ],
  },
  {
    id: "salad",
    title: "Салаты",
    items: [
      { id: "salad_caesar", title: "Цезарь", price: 390 },
      { id: "salad_greek", title: "Греческий", price: 360 },
    ],
  },
  {
    id: "drinks",
    title: "Напитки",
    items: [
      { id: "drink_lemonade", title: "Лимонад", price: 190 },
      { id: "drink_juice", title: "Сок", price: 160 },
      { id: "drink_water", title: "Вода", price: 90 },
    ],
  },
];

const tableTag = document.getElementById("tableTag");
const categoriesEl = document.getElementById("categories");
const menuEl = document.getElementById("menu");
const cartSummaryEl = document.getElementById("cartSummary");
const cartTotalEl = document.getElementById("cartTotal");
const orderButton = document.getElementById("orderButton");

tableTag.textContent = `Столик №${tableNumber}`;

const cart = new Map();
let activeCategoryId = MENU[0]?.id;

function renderCategories() {
  categoriesEl.innerHTML = "";
  MENU.forEach((cat) => {
    const pill = document.createElement("button");
    pill.className = "category-pill" + (cat.id === activeCategoryId ? " active" : "");
    pill.textContent = cat.title;
    pill.addEventListener("click", () => {
      activeCategoryId = cat.id;
      renderCategories();
      renderMenu();
    });
    categoriesEl.appendChild(pill);
  });
}

function updateCartSummary() {
  let totalItems = 0;
  let totalPrice = 0;

  for (const item of cart.values()) {
    totalItems += item.qty;
    totalPrice += item.qty * item.price;
  }

  if (totalItems === 0) {
    cartSummaryEl.textContent = "Корзина пуста";
    orderButton.disabled = true;
  } else {
    cartSummaryEl.textContent = `Выбрано позиций: ${totalItems}`;
    orderButton.disabled = false;
  }

  cartTotalEl.textContent = `${totalPrice} ₽`;
}

function changeQty(dish, delta) {
  const existing = cart.get(dish.id) || {
    id: dish.id,
    title: dish.title,
    price: dish.price,
    qty: 0,
  };

  existing.qty += delta;
  if (existing.qty <= 0) {
    cart.delete(dish.id);
  } else {
    cart.set(dish.id, existing);
  }

  renderMenu();
  updateCartSummary();
}

function getQty(dishId) {
  const item = cart.get(dishId);
  return item ? item.qty : 0;
}

function renderMenu() {
  const category = MENU.find((c) => c.id === activeCategoryId) || MENU[0];
  if (!category) return;

  menuEl.innerHTML = "";

  category.items.forEach((dish) => {
    const card = document.createElement("article");
    card.className = "dish-card";

    const main = document.createElement("div");
    main.className = "dish-main";

    const title = document.createElement("h3");
    title.className = "dish-title";
    title.textContent = dish.title;

    const meta = document.createElement("div");
    meta.className = "dish-meta";

    const price = document.createElement("span");
    price.className = "dish-price";
    price.textContent = `${dish.price} ₽`;

    meta.appendChild(price);
    main.appendChild(title);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "dish-actions";

    const qtyControl = document.createElement("div");
    qtyControl.className = "qty-control";

    const minusBtn = document.createElement("button");
    minusBtn.className = "qty-btn";
    minusBtn.textContent = "−";
    minusBtn.addEventListener("click", () => changeQty(dish, -1));

    const qtyValue = document.createElement("span");
    qtyValue.className = "qty-value";
    qtyValue.textContent = getQty(dish.id);

    const plusBtn = document.createElement("button");
    plusBtn.className = "qty-btn";
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", () => changeQty(dish, 1));

    qtyControl.appendChild(minusBtn);
    qtyControl.appendChild(qtyValue);
    qtyControl.appendChild(plusBtn);

    const addHint = document.createElement("button");
    addHint.className = "add-button";
    addHint.textContent = "В корзину";
    addHint.addEventListener("click", () => changeQty(dish, 1));

    actions.appendChild(qtyControl);
    actions.appendChild(addHint);

    card.appendChild(main);
    card.appendChild(actions);

    menuEl.appendChild(card);
  });
}

orderButton.addEventListener("click", () => {
  if (cart.size === 0) return;

  const items = Array.from(cart.values());
  const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);

  const payload = {
    table: tableNumber,
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      qty: i.qty,
      price: i.price,
    })),
    total,
  };

  if (tg) {
    tg.sendData(JSON.stringify(payload));
    tg.close();
  } else {
    alert("Отправка заказа доступна только внутри Telegram Mini App.");
    console.log("Order payload:", payload);
  }
});

renderCategories();
renderMenu();
updateCartSummary();

