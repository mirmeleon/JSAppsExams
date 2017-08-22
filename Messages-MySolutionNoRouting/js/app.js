function startApp() {
   // alert('vlezna!');
   showView('AppHome');

   //attack event handlers
  (() => {

        $('header').find('a[data-target]').click(navigateTo);//ne sa sus skobi navigateTo() shtoto az ne iskam rezultata, az iskam samata func pri klick
        $('#formRegister').submit(registerUser);
        $('#formLogin').submit(loginUser);
        $('#linkMenuLogout').click(logoutUser);
        $('#formSendMessage').submit(sendMessage);
        $('#linkUserHomeMyMessages').click(() => {
            showView("MyMessages");
            loadReceivedMessages();

        });

    $('#linkUserHomeSendMessage').click(() => {
        showView('SendMessage');
        loadAllUsers();
    });

    $('#linkUserHomeArchiveSent').click(() => {
        showView('ArchiveSent');
        loadSentMessages();
    });

      $('#linkMenuMyMessages').click(loadReceivedMessages);
      $('#linkMenuArchiveSent').click(loadSentMessages);
      $('#linkMenuSendMessage').click(loadAllUsers);
      $('.notifications').click(function() {
          $(this).hide();
      });

      })();




    if(sessionStorage.getItem('authtoken') === null){
        userLoggedOut();
    } else {
        userLoggedIn();
    }


   function navigateTo(){
       let viewName = $(this).attr('data-target');
       showView(viewName);
    }

   //Messages
    function sendMessage(ev){
       ev.preventDefault();
       let recipient = $('#msgRecipientUsername').val();
       let senderUsername = sessionStorage.getItem('username');
       let senderName = sessionStorage.getItem('name');
       let msgText = $('#msgText').val();
       //senderName, senderUsername, senderMsg, recipient

       messagesService.sendMessage(senderName,senderUsername, msgText, recipient)
           .then(() => {
               showInfo("Message sent!");
               $('#msgText').val("");
               showView('ArchiveSent');
               loadSentMessages();

           }).catch(handleError);

    }

    function loadSentMessages(){
     let username = sessionStorage.getItem('username');
     messagesService.getSentMessages(username)
         .then((msges) => {
          loadSentMessagesByUser(msges);
          showView('ArchiveSent');
         }).catch(handleError);

    }

    function loadSentMessagesByUser(myMessages){
        let messagesContainer = $('#sentMessages');
        messagesContainer.empty();
        let messagesTable = $('<table>');
        messagesTable.append($('<thead>')
            .append($('<tr>')
                .append('<th>To</th>')
                .append('<th>Message</th>')
                .append('<th>Date Sent</th>')
                .append('<th>Actions</th>')));
        let tableBody = $('<tbody>');

        for(let msg of myMessages) {
            let tableRow = $('<tr>');
            let recipient = msg['recipient_username'];
            let msgText = msg['text'];
            let msgDate = formatDate(msg['_kmd']['lmt']);
            let deleteBtn = $(`<button value="${msg._id}">Delete</button>`)
                .click(deleteMsg);
            tableRow.append($('<td>').text(recipient));
            tableRow.append($('<td>').text(msgText));
            tableRow.append($('<td>').text(msgDate));
            tableRow.append($('<td>').append(deleteBtn));
            tableBody.append(tableRow);
        }

        messagesTable.append(tableBody);
        messagesContainer.append(messagesTable);

    }

    function deleteMsg(){
     let msgId = $(this).val();

     messagesService.deleteMsg(msgId)
         .then(() => {
         showInfo('msg deleted!');
         loadSentMessages();

         }).catch(handleError);
    }

    function loadReceivedMessages(){
     let user = sessionStorage.getItem('username');
      messagesService.myMessages(user)
          .then((msges) => {
              displayAllMessages(msges);

          })
          .catch(handleError)
    }

    function displayAllMessages(myMessages){

        let messagesContainer = $('#myMessages');
        messagesContainer.empty();

        let messagesTable = $('<table>');
        messagesTable.append($('<thead>')
            .append($('<tr>')
                .append('<th>From</th>')
                .append('<th>Message</th>')
                .append('<th>Date Received</th>')));
        let tableBody = $('<tbody>');

        for(let msg of myMessages) {
            let tableRow = $('<tr>');
            let sender = formatSender(msg['sender_name'], msg['sender_username']);
            let msgText = msg['text'];
            let msgDate = formatDate(msg['_kmd']['lmt']);
            tableRow.append($('<td>').text(sender));
            tableRow.append($('<td>').text(msgText));
            tableRow.append($('<td>').text(msgDate));
            tableBody.append(tableRow);
        }

        messagesTable.append(tableBody);
        messagesContainer.append(messagesTable);

    }

    //Views with users
    function userLoggedOut(){
        $('.anonymous').show();
        $('.useronly').hide();
        $('#spanMenuLoggedInUser').text('');
       showView('AppHome');

    }

    function  userLoggedIn(){
        $('.anonymous').hide();
        $('.useronly').show();
        let username = sessionStorage.getItem('username');
        $('#spanMenuLoggedInUser').text(`Hello, ${username}`);
        $('#viewUserHomeHeading').text(`Welcome, ${username}!`);
        showView('UserHome');

    }


   //USERS
    function loadAllUsers(){

        messagesService.loadRecipients()
            .then((allUsers) => {
            displayUsersInList(allUsers);

            });

    }

    function displayUsersInList(allUsers){
        let select = $('#msgRecipientUsername');
        select.empty();
        for(let us of allUsers){
            let username = us['username'];
            let fullName = formatSender(us['name'], username);
            //predotvratiava da prashta na sebe si
            if(username!== sessionStorage.getItem('username')){

                select.append($(`<option value="${username}">${fullName}</option>`));
            }

        }

    }


    function registerUser(ev){
        ev.preventDefault();

        let username = $('#registerUsername').val();
        let pass = $('#registerPasswd').val();
        let name = $('#registerName').val();
        auth.register(username, pass, name) ////vrushta userdata
            .then((userInfo) => {
                saveSession(userInfo);
                $('#registerUsername').val("");
                $('#registerPasswd').val("");
                $('#registerName').val("");
                showInfo('Successfully registered!');
                showView('Home');//??
            }).catch(handleError);

    }

    function  loginUser(ev){
      ev.preventDefault();
      let username = $('#loginUsername').val();
      let pass = $('#loginPasswd').val();

      auth.login(username, pass)
          .then((userData) => {
          saveSession(userData);
          showInfo("Successfully logged in");
              $('#loginUsername').val("");
              $('#loginPasswd').val("");
             // userLoggedIn();
          }).catch(handleError);

    }

    function  logoutUser(){

       auth.logout()
           .then(() => {
           sessionStorage.clear();
           showInfo("Successfullty Logged out!");
           userLoggedOut();

           }).catch(handleError);
    }

    function saveSession(userInfo){

     sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
     sessionStorage.setItem('username', userInfo.username);
     sessionStorage.setItem('userId', userInfo._id);
     sessionStorage.setItem('name', userInfo.name); //tva taka dali raboti?
       userLoggedIn();
    }

    //SHOW
    function showView(viewName){

        $('main > section').hide();
        $('#view' + viewName).show();

    }

        function handleError(reason) {
            showError(reason.responseJSON.description);
        }

        function showInfo(message) {
            let infoBox = $('#infoBox');
            infoBox.text(message);
            infoBox.show();
            setTimeout(() => infoBox.fadeOut(), 3000);
        }

        function showError(message) {
            let errorBox = $('#errorBox');
            errorBox.text(message);
            errorBox.show();
            setTimeout(() => errorBox.fadeOut(), 3000);
        }

        // Handle notifications
        $(document).on({
            ajaxStart: () => $("#loadingBox").show(),
            ajaxStop: () => $('#loadingBox').fadeOut()
        });

     //funkcii ot uslovieto
    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }


}
