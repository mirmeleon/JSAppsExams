let examService = (() => {

//some logic s entitites
     function getAllProducts(){

         return requester.get('appdata', 'products', 'kinvey');
    }

    function getUser(){
         let userId= sessionStorage.getItem('id');
         return requester.get('user', userId, 'kinvey');

    }

    function updateUser(userInfo){
        let userId= sessionStorage.getItem('id');
        return requester.update('user', userId, 'kinvey', userInfo)

    }

    function getProduct(productId){
        return requester.get('appdata', 'products/' + productId, 'kinvey');

    }

    return {
      getAllProducts,
        getUser,
        updateUser,
        getProduct
    }

})();
