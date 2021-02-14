import {select, templates} from '/js/settings.js';
import utils from '/js/utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    };

    renderInMenu() {
      const thisProduct = this;
      const HTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(HTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);

    };

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget)
    };

    initAccordion() {
      const thisProduct = this;

      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        let activeProduct = document.querySelector('.product.active');

        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove('active');
        };

        thisProduct.element.classList.toggle('active');
      });
    };

    initOrderForm() {
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    };

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      let price = thisProduct.data.price;


      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId];

          if (formData[paramId] && formData[paramId].includes(optionId)) {
            if (optionId !== 'default') {
              price = price + option.price;
            }

          } else if (optionId == 'default') {
            price = price - option.price;
          };

          let image = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          if (image) {
            if (formData[paramId] && formData[paramId].includes(optionId)) {
              image.classList.add('active');
            } else {
              image.classList.remove('active')
            }
          };
        };
      };

      price *= thisProduct.amountWidget.value;

      thisProduct.priceSingle = price / thisProduct.amountWidget.value
      thisProduct.priceElem.innerHTML = price;
    };

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () { thisProduct.processOrder() });
    };

    addToCart() {
      const thisProduct = this;

     const event = new CustomEvent('add-to-cart', {
       bubbles: true,
       detail: {
         product: thisProduct,
       }
     });

     thisProduct.element.dispatchEvent(event);

    };

    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceElem.innerHTML,
        params: thisProduct.prepareCartProductParams()

      };
      return productSummary;
    };

    prepareCartProductParams() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        params[paramId] = {
          name: param.label,
          options: {}
        };

        for (let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if (optionSelected) {
            params[paramId].options[option.label] = option.label
          };
        };
      };

      return params;
    }

  };

  export default Product;