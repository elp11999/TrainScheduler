//
// JavaScript for the Amtrak Train Scheduler
//
$(document).ready(function() {

    console.log("Amtrak Train Scheduler started...");

    // Firebase database configuration
    var config = {
        apiKey: "AIzaSyDcuGueUU_g_2b8mEbCFweyPGOfHeHjOUA",
        authDomain: "yodude-24585.firebaseapp.com",
        databaseURL: "https://yodude-24585.firebaseio.com",
        projectId: "yodude-24585",
        storageBucket: "yodude-24585.appspot.com",
        messagingSenderId: "395189365829"
    };

    // Initialize Firebase database
    firebase.initializeApp(config);
        
    // Create a Firebase database object
    var database = firebase.database();
});
    