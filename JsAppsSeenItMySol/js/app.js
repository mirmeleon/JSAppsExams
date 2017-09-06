function startApp(){

   const app = Sammy('#container', function(){
      this.use('Handlebars', 'hbs');

       $(document).on({
           ajaxStart: function () {
               $("#loadingBox").show();
           },
           ajaxStop: function () {
               $("#loadingBox").hide();
           }
       });

       //HOME
       this.get('index.html', displayHome);
       this.get('#/home', displayHome);

       function displayHome(context){
          // console.log('home');
           context.isAnonimous = sessionStorage.getItem('username') === null;
           context.username = sessionStorage.getItem('username');

           context.loadPartials({
               header: './templates/common/header.hbs',
               footer: './templates/common/footer.hbs',
               home: './templates/home/home.hbs',
               loginForm:'./templates/login/loginForm.hbs',
               registerForm: './templates/register/registerForm.hbs'
           }).then(function (){
               this.partial('./templates/home/homePage.hbs')

           });

       }

       //ALL POSTS
       this.get('#/catalog', function(context){
           context.isAnonimous = sessionStorage.getItem('username') === null;
           context.username = sessionStorage.getItem('username');

           seenItService.getPosts()
               .then(function (posts) {
                  // console.log(posts);
                   let rank = 1;
                   for(let p of posts){
                   p.isAuthor = p.author === sessionStorage.getItem('username');
                   p.rank =  rank++;
                   p.time = calcTime(p._kmd.ect);
                   }

                   context.posts = posts;
                   context.rank = rank;


                   context.loadPartials({
                       header: './templates/common/header.hbs',
                       footer: './templates/common/footer.hbs',
                       singlePost: './templates/catalog/singlePost.hbs'
                   }).then(function(){
                       this.partial('./templates/catalog/allPostsPage.hbs')

                    })

                   }).catch(auth.handleError);

       });

       //MY POSTS
       this.get('#/myPosts', function(context){
           context.isAnonimous = sessionStorage.getItem('username') === null;
           context.username = sessionStorage.getItem('username');

          seenItService.getMyPosts(context.username)
              .then(function (posts) {

                  let rank = 1;
                  for(let p of posts){
                      p.isAuthor = p.author === sessionStorage.getItem('username');
                      p.rank =  rank++;
                      p.time = calcTime(p._kmd.ect);
                  }

                  context.posts = posts;
                  context.rank = rank;

                  context.loadPartials({
                      header: './templates/common/header.hbs',
                      footer: './templates/common/footer.hbs',
                      post: './templates/myPosts/posts.hbs'
                  }).then(function(){
                      this.partial('./templates/myPosts/myPostsPage.hbs')

                  })

                  }

              ).catch(auth.handleError)

       });

       //POST DETAILS
       this.get('#/comments/:id', showComments);

       function showComments(ctx){
          // console.log(ctx); //dava path na url i metod, a v params e get zaiavkata sled ?
           let pId = ctx.params.id.substr(1);

           ctx.isAnonimous = sessionStorage.getItem('username') === null;
           ctx.username = sessionStorage.getItem('username');

           let postPromise = seenItService.getPostComments(pId);
           let commentsPromise = seenItService.getCommentsForPost(pId);

           Promise.all([postPromise, commentsPromise])
               .then(([postInfo, comments]) => {
                   ctx.imageUrl = postInfo.imageUrl;
                   ctx.url = postInfo.url;
                   ctx.title = postInfo.title;
                   ctx.description = postInfo.description;
                   ctx.time = calcTime(postInfo._kmd.ect);
                   ctx.author = postInfo.author;
                   ctx._id = postInfo._id;

                   for(let c of comments){
                       c.isAutor = c.author === sessionStorage.getItem('username');
                       c.time = calcTime(c._kmd.ect);
                       c.postId = c._id;
                   }

                   ctx.comments = comments;

                   ctx.loadPartials({
                       header: './templates/common/header.hbs',
                       footer: './templates/common/footer.hbs',
                       postDetail: './templates/comments/postDetail.hbs',
                       commentForm: './templates/comments/commentForm.hbs',
                       singleComment: './templates/comments/singleComment.hbs',
                   }).then(function(){
                       this.partial('./templates/comments/commentsPage.hbs');

                   })
               });

       }

       this.post('#/postComment', function (ctx){

           let id = location.hash.substr(location.hash.indexOf(':') + 1);
           seenItService.createComment(id)
               .then(function (postInfo){

                   auth.showInfo('comment published!');
                  ctx.redirect(`#/comments/:${id}`)

               })
               .catch(auth.handleError);

       });

       //DELETE COMMENT
       this.get('#/deleteComment/:id', function(ctx){

          let id = ctx.params.id.substr(1);
          seenItService.deleteComment(id)
              .then(() => {
              auth.showInfo('comment deleted!');
              window.history.go(-1); //go back previous page

              }).catch(auth.handleError);


       });

       //SUBMIT NEW POST PAGE
       this.get('#/submitLink', function(ctx){
           ctx.isAnonimous = sessionStorage.getItem('username') === null;
           ctx.username = sessionStorage.getItem('username');

           ctx.loadPartials({
               header: './templates/common/header.hbs',
               footer: './templates/common/footer.hbs',
               postForm: './templates/posts/postForm.hbs'
           }).then(function (){
               this.partial('./templates/posts/postPage.hbs')

           });


       });

       this.post('#/submitPost', function(postInfo){
           let author = sessionStorage.getItem('username');
         let url = postInfo.params.url;
         let title = postInfo.params.title;
         let image = postInfo.params.image;
          let comment = postInfo.params.comment;

          let data = {
              author:author,
              title: title,
              url: url,
              imageUrl: image,
              description: comment
          };

          seenItService.createPost(data)
              .then(function(ctx){
                 auth.showInfo('post created!');
                 let form = $('#submitForm');

                 form.find('input[name="url"]').val('');
                  form.find('input[name="title"]').val('');
                  form.find('input[name="image"]').val('');
                  form.find('textarea[name="comment"]').val('');

                  postInfo.redirect('#/catalog');

           }).catch(auth.handleError);

       });

       //EDIT POST
       this.get('#/edit/:id', function(ctx) {
           let id = location.hash.substr(location.hash.indexOf(':') + 1);

           ctx.isAnonimous = sessionStorage.getItem('username') === null;
           ctx.username = sessionStorage.getItem('username');

           seenItService.getPostComments(id)
               .then(function(postInfo) {
                   //ctx.imageUrl = postInfo.imageUrl;
                  ctx.title = postInfo.title;
                  ctx.url = postInfo.url;
                  ctx.imageUrl = postInfo.imageUrl;
                  ctx.description = postInfo.description;


                   ctx.loadPartials({
                       header: './templates/common/header.hbs',
                       footer: './templates/common/footer.hbs',
                       post: './templates/editPost/editPost.hbs',
                       editPostForm:'./templates/editPost/editPostForm.hbs'

                   }).then(function () {
                       this.partial('./templates/editPost/editPostPage.hbs')

                   })
               }).catch(auth.handleError);
       });

       this.post('#/submitEditPost', function(postInfo) {
           let author = sessionStorage.getItem('username');
           let url = postInfo.params.url;
           let title = postInfo.params.title;
           let image = postInfo.params.image;
           let description = postInfo.params.description;

           let data = {
               author: author,
               title: title,
               url: url,
               imageUrl: image,
               description: description
           };

           seenItService.createPost(data)
               .then(function (ctx) {
                   auth.showInfo('post created!');
                   let form = $('#submitForm');

                   form.find('input[name="url"]').val('');
                   form.find('input[name="title"]').val('');
                   form.find('input[name="image"]').val('');
                   form.find('textarea[name="description"]').val('');

                   postInfo.redirect('#/catalog');

               }).catch(auth.handleError);
       });

       //DELETE POST
       this.get('#/delete/:id', function(ctx){
          let id = ctx.params.id.substr(1);
           console.log(id);
           seenItService.deletePost(id)
               .then(function() {
                  auth.showInfo('post deleted!');
                   window.history.go(-1); //go back previous page

                   }

               ).catch(auth.handleError);

       });

      //HELPER FUNCTIONS FOR DATE
       function calcTime(dateIsoFormat) {
           let diff = new Date - (new Date(dateIsoFormat));
           diff = Math.floor(diff / 60000);
           if (diff < 1) return 'less than a minute';
           if (diff < 60) return diff + ' minute' + pluralize(diff);
           diff = Math.floor(diff / 60);
           if (diff < 24) return diff + ' hour' + pluralize(diff);
           diff = Math.floor(diff / 24);
           if (diff < 30) return diff + ' day' + pluralize(diff);
           diff = Math.floor(diff / 30);
           if (diff < 12) return diff + ' month' + pluralize(diff);
           diff = Math.floor(diff / 12);
           return diff + ' year' + pluralize(diff);

           function pluralize(value) {
               if (value !== 1) return 's';
               else return '';
           }
       }


       //Register post
       this.post('#/register', function (context) {
          // console.log('post');

           let username = context.params.username;
           let password = context.params.password;
           let repeatPass = context.params.repeatPass;

           let usernamePattern = "/^[a-zA-Z]{3,}$/g";
           let passPattern = "/^[a-zA-Z\d]{6,}$/g";
           let rgx = new RegExp(usernamePattern);
           let rgxPass = new RegExp(passPattern);

           if(password !== repeatPass ){
              auth.showInfo("passwords dont match!");
          } else if (rgx.test(username)){      //tia ne mi rabotiat
             auth.showInfo("username must be min 3 latin chars!")
          } else if(rgxPass.test(password)){
              auth.showInfo("pass must be min 6 latin chars and digits!")
          } else {
              auth.register(username, password)
                  .then(function (userInfo) {
                      auth.saveSession(userInfo);
                      auth.showInfo('User registration successful.');



                      $('#registerForm [input=username]').val('');
                      $('#registerForm [input=password]').val('');
                      $('#registerForm [input=repeatPass]').val('');

                      //todo display all posts
                      displayHome(context);

                  }).catch(auth.handleError)
          }


       });

       //Login
       this.post('#/login', function(context){

           let username = context.params.username;
           let password = context.params.password;

           auth.login(username, password)
               .then(function (userInfo) {
                   auth.saveSession(userInfo);
                   auth.showInfo('Login successful.');

                   $('#loginForm [input=username]').val('');
                   $('#loginForm [input=password]').val('');

                   displayHome(context);
               }).catch(auth.handleError);

       });



       // LOGOUT
       this.get('#/logout', function (context) {

           auth.logout()
               .then(function () {
                   sessionStorage.clear();
                   auth.showInfo('Logout successful.');

                   displayHome(context);
               }).catch(auth.handleError);
       });



   });
    app.run();
}



