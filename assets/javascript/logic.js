//
// JavaScript for the Amtrak Train Scheduler
//
$(document).ready(function() {

    console.log("Amtrak Train Scheduler started...");
   
    var currentSchedule = {
        arrivalTime: "17:58 a",
        frequency: 3,
        minutesAway: 0
    }

    var trains = [];
    
    //getMinutesAway(currentSchedule);
    //return;

    // Firebase database configuration<script>
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

    // Firebase callback when a record has been added
    database.ref().on('child_added', function(snapshot) {
        var scheduleInfo = snapshot.val();
        console.log("We are here!!!");
        console.log(scheduleInfo);

        trains.push(scheduleInfo);

        // Updated train info
        getMinutesAway(scheduleInfo);

        // Add train to the markup
        renderRecentSchedule(scheduleInfo);

    });  

    function renderRecentSchedule(scheduleInfo) {
        var tr = $("<tr>");
        $(tr).append($("<td>" + scheduleInfo.trainName + "</td>"));
        $(tr).append($("<td>" + scheduleInfo.destination + "</td>"));
        $(tr).append($("<td>" + scheduleInfo.frequency + "</td>"));
        $(tr).append($("<td>" + scheduleInfo.arrivalTime + "</td>"));
        $(tr).append($("<td>" + scheduleInfo.minutesAway + "</td>"));
        $("#train-schedule").append(tr);
    };

    function createInitialMinutesAway(intialArrivalTime) {
        var minutesAway = 0;

        var currentTime = moment();

        var nextArrivalTime = moment(intialArrivalTime, "hh:mm");

        var duration = moment.duration(nextArrivalTime.diff(currentTime));

        minutesAway = Math.trunc(duration.asMinutes());

        console.log(">>minutesAway=" + minutesAway);
        if (minutesAway < 0) {
            var tmp = (~minutesAway) + 1;
            console.log(">>tmp=" + tmp);
            minutesAway = 1440 - tmp;
        }
        console.log(">>minutesAway=" + minutesAway);
        return minutesAway;
    }

    function getMinutesAway(schedule) {

        var minutesAway = 0;

        // Convert the frequency to an integer
        var frequency = parseInt(schedule.frequency);

        
        var currentTime = moment();
        console.log(">>>currentTime=" + currentTime.format("hh:mm a"));
        var nextArrivalTime = moment(schedule.arrivalTime, "hh:mm a");
        console.log(">>>nextArrivalTime=" + nextArrivalTime.format("hh:mm a"));
        var duration = moment.duration(nextArrivalTime.diff(currentTime));
        var diffMinutes = Math.ceil(duration.asMinutes());
        console.log(">>>1 diffMinutes=" + diffMinutes);
        if (diffMinutes < 0)  {      
            diffMinutes = ~diffMinutes;
            console.log(">>>2 diffMinutes=" + diffMinutes);
        }
        //minutesAway = Math.trunc(duration.asMinutes());
       
        /*
        // Get current time
        var currentTime = moment();
        //console.log("currentTime=" + currentTime);
        console.log("currentTime=" + currentTime.format("hh:mm a"));

        // Get next arrival time
        var nextArrivalTime = moment(schedule.arrivalTime, "hh:mm a");
        console.log("nextArrivalTime=" + nextArrivalTime.format("hh:mm a"));
        console.log("schedule.frequency=" + frequency);

        // Get minutes between current time and the next arrival time
        var diffMinutes = currentTime.diff(moment(nextArrivalTime), "minutes");
        if (diffMinutes < 0)        
            diffMinutes = ~diffMinutes;
        console.log("diffMinutes=" + diffMinutes + " minutes");
        */

        console.log(">>>diffMinutes=" + diffMinutes);
        console.log(">>>frequency=" + frequency);
        // Get how many minutes until next arrival
        if (diffMinutes < 0) {
            console.log("We are here 1");
            minutesAway = nextArrivalTime.diff(moment(currentTime), "minutes") + 1;
        } else if (diffMinutes == 0) {
            console.log("We are here 2");
            minutesAway = frequency;
            nextArrivalTime = nextArrivalTime.add(frequency, 'minutes');  
        } else {
            var modulus = diffMinutes % frequency;
            console.log("modulus=" + modulus);
            if (modulus === 0) {
                console.log("We are here 3");
                minutesAway = frequency;
                nextArrivalTime = currentTime.add(frequency, 'minutes');
            } else {
                if (diffMinutes > frequency) {
                    console.log("We are here 4");
                    var temp = diffMinutes + frequency;
                    var minutesToNewArrival = temp - (temp % frequency);
                    nextArrivalTime = nextArrivalTime.add(minutesToNewArrival, 'minutes');                    
                    minutesAway = frequency - modulus;
                } else {
                    console.log("We are here 5");                
                    minutesAway = modulus;                                    
                    //minutesAway = frequency - diffMinutes;
                    //nextArrivalTime = nextArrivalTime.add(frequency, 'minutes');                    
                }
            }
        }
        schedule.minutesAway = minutesAway;
        schedule.arrivalTime = nextArrivalTime.format("hh:mm a").toUpperCase();
        console.log("minutesAway=" + minutesAway);
        console.log("nextArrivalTime=" + schedule.arrivalTime);
    }

    // Callback when the submit button is clicked
    $(".form-button").click(function(event) {
        var minutesAway = 0;        

        // Don't refresh the page!
        event.preventDefault();

        console.log("Submit button clicked.");

        // Create initial minutes away
        //minutesAway =  createInitialMinutesAway("21:23");
        minutesAway =  createInitialMinutesAway($('#arrival-time').val());

        // Build a new database record
        var scheduleInfo = {
            trainName: $('#train-name').val(),
            destination: $('#destination').val(),
            frequency: $('#frequency').val(),
            arrivalTime: $('#arrival-time').val(),            
            minutesAway: minutesAway
        };
        console.log(scheduleInfo);
    
        // Update the database with a new record
        var crap = database.ref().push(scheduleInfo);
        console.log("crap=" + crap);
    
        // Clean up the form
        $('#train-name').val('')
        $('#destination').val('')
        $('#arrival-time').val('')
        $('#frequency').val('')
    });

    // Callback when the refresh button is clicked
    $(".refresh-button").click(function(event) {
        var minutesAway = 0;        

        // Don't refresh the page!
        event.preventDefault();

        console.log("Refresh button clicked.");

        // Refresh all train schedules
        trains.forEach(function(scheduleInfo) {
            console.log(scheduleInfo);            
            getMinutesAway(scheduleInfo);
        });

        // Udate train schedules        
        $("#train-schedule").empty();
        trains.forEach(function(scheduleInfo) {
            console.log(scheduleInfo);            
            renderRecentSchedule(scheduleInfo);
        });
    
        // Update the database with a new record
        //database.ref().push(scheduleInfo);
    });
});
    