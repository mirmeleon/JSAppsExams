function startApp(){
  // alert("vlezna");
  const app = Sammy("#app", function(){ //vnimanie tuy #app da vidia dali e sushtoto
      this.use('Handlebars', 'hbs');

      $(document).on({
          ajaxStart: function () {
              $("#loadingBox").show()
          },
          ajaxStop: function () {
              $("#loadingBox").hide()
          }
      });

      //HOME
      this.get('index.html', displayHome);
      this.get('#/home', displayHome); //da napravia v html-a linkovete taka

      function displayHome(context){
          //s context podavame na hbs templs stoynostite
          context.isAnonymous = sessionStorage.getItem("username") === null;
          context.username = sessionStorage.getItem("username");

          context.loadPartials({
              header: './templates/common/header.hbs',
              footer: './templates/common/footer.hbs',
              home: './templates/home/home.hbs'
          }).then(function (){
              this.partial('./templates/home/homePage.hbs');

          });
     }

     //LOGIN
      this.get('#/login', function (context) {

          context.isAnonymous = sessionStorage.getItem('username') === null;
          context.username = sessionStorage.getItem('username');

          context.loadPartials({
              header: './templates/common/header.hbs',
              footer: './templates/common/footer.hbs',
              loginForm: './templates/login/loginForm.hbs'
          }).then(function () {
              this.partial('./templates/login/loginPage.hbs')
          });
      });

      //login post ->da opravia formata s action i metod
      this.post('#/login', function (context) {

          let username = context.params.username;
          let password = context.params.password;

          auth.login(username, password)
              .then(function (userInfo) {
                  auth.saveSession(userInfo);
                  auth.showInfo('Login successful.');

                  displayHome(context);
              }).catch(auth.handleError);
      });

      // REGISTER
      this.get('#/register', function (context) {

          context.isAnonymous = sessionStorage.getItem('username') === null;
          context.username = sessionStorage.getItem('username');

          context.loadPartials({
              header: './templates/common/header.hbs',
              footer: './templates/common/footer.hbs',
              registerForm: './templates/register/registerForm.hbs'
          }).then(function () {
              this.partial('./templates/register/registerPage.hbs')
          });
      });

      this.post('#/register', function (context) {

          let username = context.params.username;
          let password = context.params.password;
          let name = context.params.name;          //da vidia dali ne iskat oshte neshta

          auth.register(username, password, name)
              .then(function (userInfo) {
                  auth.saveSession(userInfo);
                  auth.showInfo('User registration successful.');

                  displayHome(context);
              }).catch(auth.handleError)
      });

      //LOGOUT
      this.get('#/logout', function(context){
         auth.logout()
             .then(function(){
               sessionStorage.clear();
               auth.showInfo('Logout successful.');

               displayHome(context);
             }) .catch(auth.handleError);

      });

     //PRODUCTS
      this.get('#/shop', function(context){

          context.isAnonymous = sessionStorage.getItem('username') === null;
          context.username = sessionStorage.getItem('username');

          examService.getAllProducts()
              .then(function(products) {
                  //samo gi obrushtam na number
                  for(let p of products){
                      p['price'] = Number(p['price']).toFixed(2);
                  }

                  context.products = products;

                  context.loadPartials({
                      header: './templates/common/header.hbs',
                      footer: './templates/common/footer.hbs',
                      product: './templates/products/product.hbs'
                  }).then(function(){
                      this.partial('./templates/products/productPage.hbs')
                          .then(function() {
                              let btn = $('button');
                              btn.click(function (){
                                  let productId = $(this).attr('data-id');
                                  purchaseProduct(productId);

                              });

                          });

                  });
              }).catch(auth.handleError);

            //pri natiskane na butona kupi
           function purchaseProduct(productId){

                examService.getProduct(productId) //zimam produkta
                    .then(function(product) {

                        examService.getUser()   //zimam usera zaradi kolichkata(cart) mu
                            .then(function (userInfo){
                                let cart;
                                if(userInfo['cart'] === undefined){
                                    cart = {};
                                } else {
                                    cart = userInfo['cart'];
                                }

                                //Ako veche e kupil ot tozi product
                                if(cart.hasOwnProperty(productId)){
                                    cart[productId] = {
                                        quantity: Number(cart[productId]['quantity'] + 1),
                                        product:{
                                            name: product['name'],
                                            description: product['description'],
                                            price:product['price']
                                        }
                                    }
                                } else {
                                    cart[productId] = {
                                        quantity: 1,
                                        product:{
                                            name: product['name'],
                                            description: product['description'],
                                            price:product['price']
                                        }
                                    }
                                }

                                userInfo.cart = cart;
                                examService.updateUser(userInfo) //zapisvam updatnatat kolichka v dbto
                                    .then(function(userInfo){

                                        auth.showInfo('product has been purchased!');
                                    });

                            });

                    }).catch(auth.handleError);
                }

      });

      //CART
      this.get('#/cart', displayCart);

      function displayCart(context){

          context.isAnonymous = sessionStorage.getItem('username') === null;
          context.username = sessionStorage.getItem('username');

          examService.getUser()
              .then(function (userInfo) {
                let cart = userInfo.cart;
                let products = [];
                let keys = Object.keys(cart);//ziame imenata na prop pr price, qty i tn
                  for(let id of keys){
                      let product = {
                          _id: id,
                          name: cart[id]['product']['name'],
                          description: cart[id]['product']['description'],
                          quantity: cart[id]['quantity'],
                          totalPrice: Number(cart[id]['product']['price']) * Number(cart[id]['quantity'])
                       };
                      products.push(product);
                  }

                  context.products = products;

                  context.loadPartials({
                      header: './templates/common/header.hbs',
                      footer: './templates/common/footer.hbs',
                      cart: './templates/cart/cart.hbs'
                  }).then(function() {
                      this.partial('./templates/cart/cartPage.hbs')
                          .then(function(){
                              $('button').click(function(){
                                  let productId = $(this).attr('data-id');
                                  discardProduct(productId);

                              })

                          });
                  })
              }).catch(auth.handleError);

          function discardProduct(productId){
              examService.getUser()
                  .then(function(userData){

                      let cart = userData.cart;
                      let quantity = Number(cart[productId]['quantity']) - 1;
                      if(quantity === 0){
                          delete cart[productId]; //tuka dava interesna greshka -> id:NAN vmesto da go premahne izcialo
                      } else {
                          cart[productId] = quantity;
                      }

                      userData['cart'] = cart;

                      examService.updateUser(userData)
                          .then(function (){
                              auth.showInfo("Product discarted");
                            displayCart(context);

                          })
                  })

          }
      }




  }); //end sammy

  app.run();

}