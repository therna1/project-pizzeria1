import{settings, select, templates} from '/js/settings.js';
import utils from '/js/utils.js';
import CartProduct from './CartProduct.js';



class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();


    };

    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.toggleTriggerPrice = thisCart.dom.wrapper.querySelector(select.cart.toggleTriggerPrice);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      
    };

    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function () { thisCart.dom.wrapper.classList.toggle('active') })

      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function (event) {
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    };

    add(menuProduct) {
      const thisCart = this;

      const HTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(HTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();

    };

    update() {
      const thisCart = this;
      let deliveryFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0;
      let subtotalPrice = 0;


      for (let product of thisCart.products) {
        
        totalNumber = totalNumber + product.amount;
        subtotalPrice = subtotalPrice + product.price;
      };

      if (subtotalPrice == 0) {
       thisCart.totalPrice = 0;
       deliveryFee = 0;

      } else {
        thisCart.totalPrice = subtotalPrice + deliveryFee;
      };

       thisCart.deliveryFee = deliveryFee;
       thisCart.subtotalPrice = subtotalPrice;  
       thisCart.totalNumber = totalNumber; 


      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.subTotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.toggleTriggerPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    };

    remove(menuProduct){
      const thisCart = this;
      let indexOfProduct = thisCart.products.indexOf(menuProduct);

      thisCart.products.splice(indexOfProduct, 1);
      menuProduct.dom.wrapper.remove();
      
      thisCart.update();
    };

    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.order;

      let payload = {
       
          address: thisCart.dom.address,
          phone: thisCart.dom.phone, 
          totalPrice: thisCart.totalPrice,
          subTotalPrice: thisCart.subTotalPrice,
          totalNumber: thisCart.totalNumber,
          deliveryFee: thisCart.deliveryFee,
          products: []
      };

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    
    fetch(url, options)
};
  };

  export default Cart;