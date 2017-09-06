let seenItService = function(){

    //GET ALL POSTS
    function getPosts(){
      let endPoint = 'posts?query={}&sort={"_kmd.ect": -1}';
      return  requester.get('appdata', endPoint, 'kinvey');

    }

    //Get single POST //tva id e na posta id
    function getPostComments(postId){
      // let endPoint = 'https://baas.kinvey.com/appdata/app_id/posts/post_id'
        return requester.get('appdata', 'posts/' + postId, 'kinvey')

    }

    function getCommentsForPost(postId){
        //https://baas.kinvey.com/appdata/app_id/comments?query={"postId":"post_id"}&sort={"_kmd.ect": -1}
        return requester.get('appdata', 'comments?query={"postId":"'+ postId + '"}&sort={"_kmd.ect": -1}', 'kinvey')

    }
        //CREATE COMMENT
    function createComment(postId){
        //https://baas.kinvey.com/appdata/app_id/comments
       let author = sessionStorage.getItem('username');
       let commentText = $('#commentForm').find('textarea[name="content"]').val();

       let data = {
           author: author,
           content: commentText,
           postId: postId
       };
     return  requester.post('appdata', 'comments',  'kinvey', data);

    }

    //DELETE COMMENT
    function deleteComment(commentId){

       return requester.remove('appdata', `comments/${commentId}`, 'kinvey');

    }

    //CREATE POST
    function createPost(data){
        //module, endpoint, auth, data
        //https://baas.kinvey.com/appdata/app_id/posts
        return requester.post('appdata', 'posts', 'kinvey', data);
    }

    //DELETE POST
    function deletePost(postId){
        //https://baas.kinvey.com/appdata/app_id/posts/post_id
        return requester.remove('appdata', 'posts/'+ postId, 'kinvey');
    }

    //GET MY POsTS
    function getMyPosts(author){
        // https://baas.kinvey.com/appdata/app_id/posts?query={"author":"username"}&sort={"_kmd.ect": -1}
       return requester.get('appdata', `posts?query={"author":"${author}"}&sort={"_kmd.ect": -1}`, 'kinvey');

    }

    return {
        getPosts,
        getPostComments,
        getCommentsForPost,
        createComment,
        deleteComment,
        createPost,
        deletePost,
        getMyPosts
    }

}();