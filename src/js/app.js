
import {settings, classNames, select} from './settings.js';
import Product from './components/Product.js'
import Cart from './components/Cart.js';
import Booking from './components/booking.js';



  const app = {

    initBooking: function(){
      const thisApp = this;

      thisApp.bookingContainer = document.querySelector(select.containerOf.booking);
      new Booking(thisApp.bookingContainer);

    },

    initPages: function(){
      const thisApp = this;

      thisApp.pages = document.querySelector(select.containerOf.pages).children;  
      thisApp.navLinks = document.querySelectorAll(select.nav.links);

      const IdFromHash = window.location.hash.replace('#/', '');
      let pageMatchingHash = thisApp.pages[0].id;

      for(let page of thisApp.pages){
        if(page.id == IdFromHash){
          pageMatchingHash = page.id;
          break;
        };
      };

      thisApp.activatePage(pageMatchingHash);
     
     for(let link of thisApp.navLinks){
       link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();

        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);

        window.location.hash ='#/' + id
       });
     };
    },

    activatePage: function(pageId){
      const thisApp = this;

      for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
      };

      for(let link of thisApp.navLinks){
        link.classList.toggle(
          classNames.nav.active, 
          link.getAttribute('href') == '#' + pageId
        );
      };
    },

    initMenu: function () {
      const thisApp = this;

      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      };
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;

      fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){

       thisApp.data.products = parsedResponse;
       thisApp.initMenu();
      })
    },

    init: function () {
      const thisApp = this;
      thisApp.initData();
      thisApp.initPages();
      thisApp.initBooking();
    },

    initCart: function () {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);

      thisApp.productList = document.querySelector(select.containerOf.menu);
      thisApp.productList.addEventListener('add-to-cart', function(event){
        app.cart.add(event.detail.product.prepareCartProduct());
      })
    }
  };

  app.init();
  app.initCart();

