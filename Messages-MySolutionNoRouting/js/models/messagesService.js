let messagesService = (() => {
    //module = appdata/user
    //endpoint = `messages?query={"sender_username":"${username}"/login/_logout/register

    function sendMessage(senderName, senderUsername, senderMsg, recipient){

       let data = {
           recipient_username:  recipient,
           text: senderMsg,
           sender_username:senderUsername,
           sender_name: senderName
       };
       return requester.post('appdata', 'messages', 'kinvey', data);

    }

    function loadRecipients(){

        return requester.get('user', '', 'kinvey');

    }

    function getSentMessages(username){
        let endpoint = `messages?query={"sender_username":"${username}"}`;
        return requester.get('appdata', endpoint, 'kinvey');

    }

    function deleteMsg(id){

        return requester.remove('appdata',`messages/${id}`, 'kinvey');
    }

    function myMessages(user){
        let endpoint = `messages?query={"recipient_username":"${user}"}`;
        return requester.get('appdata', endpoint, 'kinvey');

    }
    return {
        sendMessage,
        loadRecipients,
        getSentMessages,
        deleteMsg,
        myMessages
    }
})();