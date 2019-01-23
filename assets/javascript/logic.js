//
// JavaScript for the Amtrak Train Scheduler
//
$(document).ready(function() {

    console.log("Amtrak Train Scheduler started...");

    var trains = [];

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
        console.log("Database updated for key=" + snapshot.key);
        var scheduleInfo = snapshot.val();
        scheduleInfo.databaseKey = snapshot.key;
        console.log(scheduleInfo);

        trains.push(scheduleInfo);

        // Updated train info
        getMinutesAway(scheduleInfo);

        // Add train to the markup
        renderRecentSchedule(scheduleInfo);

        // Update drop down lists
        updateDropDownList($(".edit-dropdown-menu"), "edit-train", editTrain);
        updateDropDownList($(".delete-dropdown-menu"), "delete-train", deleteTrain);

        // Show train schedule area
        $(".train-schedule-area").css("display", "block");

        // Show edit and delete buttons
        $(".edit-dropdown").css("display", "inline-block");
        $(".delete-dropdown").css("display", "inline-block");

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
        //minutesAway = Math.trunc(duration.asMinutes());        
        minutesAway = Math.ceil(duration.asMinutes());
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
        
        // Get how many minutes until next arrival
        var currentTime = moment();
        console.log(">>>currentTime=" + currentTime.format("hh:mm a"));
        var nextArrivalTime = moment(schedule.arrivalTime, "hh:mm a");
        console.log(">>>nextArrivalTime=" + nextArrivalTime.format("hh:mm a"));

        var currentDay = currentTime
        var duration = moment.duration(nextArrivalTime.diff(currentTime));
        var diffMinutes = Math.ceil(duration.asMinutes());
        console.log(">>>1 diffMinutes=" + diffMinutes);
        if (diffMinutes < 0)  {     
            diffMinutes = ~diffMinutes + 1;
            console.log(">>>2 diffMinutes=" + diffMinutes);
        }

        //diffMinutes = createInitialMinutesAway(schedule.arrivalTime);
        console.log(">>>diffMinutes=" + diffMinutes);
        console.log(">>>frequency=" + frequency);
        
        // Update train schedule
         if (currentTime.isBefore(nextArrivalTime)) {
            console.log("We are here 1");
            minutesAway = diffMinutes;
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
                    minutesAway = frequency - diffMinutes;
                    nextArrivalTime = nextArrivalTime.add(frequency, 'minutes');                    
                }
            }
        }
        schedule.minutesAway = minutesAway;
        schedule.arrivalTime = nextArrivalTime.format("hh:mm a").toUpperCase();
        console.log("minutesAway=" + minutesAway);
        console.log("nextArrivalTime=" + schedule.arrivalTime);
    }

    function updateDropDownList(dropDownList, cls, func) {

        // Update drop downlist
        console.log(dropDownList);       
        $(dropDownList).empty();
        trains.forEach(function(scheduleInfo) {            
            $(dropDownList).append($("<a class=\"" + cls + " dropdown-item\" href=\"#\">" + scheduleInfo.trainName + "</a>"));
        });
        $("."+ cls).click(func);

    };

    // Callback when the submit button is clicked
    $(".submit-button").click(function(event) {
        // Don't refresh the page!
        event.preventDefault();

        var id = $(this).attr("id");
        console.log("Submit button clicked. id=" + id);

        // Clear message area
        $(".config-message").text("");

        // Get values from form
        var trainName = $('#train-name').val().trim();
        var destination = $('#destination').val().trim();
        var arrivalTime = $('#arrival-time').val().trim();
        var frequency = $('#frequency').val().trim();
        var minutesAway = 0;

        // Verify all form data is present
        if (trainName.length == 0) {
            $(".config-message").text("Error: Please enter a train name.")
            return;
        }
        if (destination.length == 0) {
            $(".config-message").text("Error: Please enter a destination.")
            return;
        }
        if (arrivalTime.length == 0) {
            $(".config-message").text("Error: Please first arrival time.")
            return;
        }
        if (frequency.length == 0) {
            $(".config-message").text("Error: Please enter a frequency.")
            return;
        }

        // Create initial minutes away
        minutesAway = createInitialMinutesAway(arrivalTime);

        if (id === "add-new-train") {
            // Build a new database record
            var scheduleInfo = {
                trainName: trainName,
                destination: destination,
                initialArrivalTime: arrivalTime, 
                arrivalTime: arrivalTime,   
                frequency: frequency,         
                minutesAway: minutesAway,
                databaseKey: ""
            };

            console.log(scheduleInfo);

            // Update the database with a new record
            database.ref().push(scheduleInfo);
        } else {
            var scheduleInfo = null;
            if ((scheduleInfo = findTrain(trainName)) !== null) {
                scheduleInfo.destination = destination;
                scheduleInfo.initialArrivalTime = arrivalTime;     
                scheduleInfo.arrivalTime = arrivalTime;    
                scheduleInfo.frequency = frequency;   
                scheduleInfo.minutesAway = minutesAway;

                // Update the database with a new changes
                database.ref(scheduleInfo.databaseKey).update(scheduleInfo);
            }
        }
    
        // Reset the form
        $('#train-name').val('');
        $('#destination').val('');
        $('#arrival-time').val('');
        $('#frequency').val('');

        // Hide train configuration area
        $(".train-config-area").hide();

        // Show train schedule area
        $(".train-schedule-area").show();
    });

    // Callback when the cancel button is clicked
    $(".cancel-button").click(function(event) {

        // Don't refresh the page!
        event.preventDefault();

        // Set header text
        $(".config-message").text("");

        // Hide train configuration area
        $(".train-config-area").hide();

        // Show train schedule area
        $(".train-schedule-area").show();
    });

    // Callback when the add train button is clicked
    $(".add-train-button").click(function(event) {

        // Don't refresh the page!
        event.preventDefault();

        $(".train-config-header").text("Add New Train");
        
        $(".submit-button").attr("id", "add-new-train");

        // Show train configuration area
        $(".train-config-area").css("display", "block");

        // Hide train schedule area
        $(".train-schedule-area").hide();
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

        // Update train schedules
        $("#train-schedule").empty();
        trains.forEach(function(scheduleInfo) {
            console.log(scheduleInfo);            
            renderRecentSchedule(scheduleInfo);
            database.ref(scheduleInfo.databaseKey).update(scheduleInfo);
        });    
    });

    function findTrain(trainName) {
        var info = null;
        trains.forEach(function(scheduleInfo) {
            if (scheduleInfo.trainName === trainName) {
                info = scheduleInfo;
                return;
            }
        });
        return info;        
    }
    
    // Callback when the edit train button is clicked
    function editTrain(event) {
        var scheduleInfo = null;

        // Don't refresh the page!
        event.preventDefault();

        var train = $(this).text();
        console.log("Edit button clicked for " + train);

        if ((scheduleInfo = findTrain(train)) !== null) {
            // Set header text
            $(".train-config-header").text("Edit Train");            
 
            $(".submit-button").attr("id", "update-train");
        
            $('#train-name').val(scheduleInfo.trainName);
            $('#destination').val(scheduleInfo.destination);
            $('#arrival-time').val(scheduleInfo.initialArrivalTime);
            $('#frequency').val(scheduleInfo.frequency);            

            // Show train configuration area
            $(".train-config-area").css("display", "block");
    
            // Hide train schedule area
            $(".train-schedule-area").hide();

        }
    };
    
    // Callback when the delete train button is clicked
    function deleteTrain(event) {
        var scheduleInfo = null;

        // Don't refresh the page!
        event.preventDefault();

        var train = $(this).text();
        console.log("Delete button clicked for " + train);
        
        if ((scheduleInfo = findTrain(train)) !== null) {
            // Update the database with a new changes
            database.ref(scheduleInfo.databaseKey).remove()
            .then(function() {
              console.log("Remove succeeded.")
            })
            .catch(function(error) {
              console.log("Remove failed: " + error.message)
            });
        }

    };

});
    