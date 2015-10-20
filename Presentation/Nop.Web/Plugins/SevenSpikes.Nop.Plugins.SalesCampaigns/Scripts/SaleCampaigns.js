function formatTime(element, timeInSeconds, clockType) {
    var days_remaining = Math.floor(timeInSeconds / 60 / 60 / 24);
    var hours_remaining = timeInSeconds / 60 / 60;

    if (clockType !== 10) {
        hours_remaining = hours_remaining % 24;
    }

    hours_remaining = Math.floor(hours_remaining);

    var minutes_remaining = Math.floor((timeInSeconds / 60) % 60);
    var seconds_remaining = timeInSeconds % 60;

    var timeString = "";

    if (clockType !== 10) {
        timeString += days_remaining + " " + (days_remaining !== 1 ? localizationArray['days'] : localizationArray['day']);
    }

    if (clockType !== 15) {
        if (clockType !== 10) {
            timeString += ", ";
        }

        timeString += hours_remaining + " " + (hours_remaining !== 1 ? localizationArray['hours'] : localizationArray['hour']) + ", ";
        timeString += minutes_remaining + " " + (minutes_remaining !== 1 ? localizationArray['minutes'] : localizationArray['minute']) + ", ";
        timeString += seconds_remaining + " " + (seconds_remaining !== 1 ? localizationArray['seconds'] : localizationArray['second']);
    }

    $(element).text(timeString);
}

$(document).ready(function () {
    $('.countdownTimer').each(function () {
        var current = $(this);
        var time = current.data("time");
        var seconds = parseInt(time);

        var type = current.data("clocktype");
        var clockType = parseInt(type);

        var interval = setInterval(function () {
            formatTime(current, seconds, clockType);

            seconds -= 1;

            current.data("time", seconds);

            if (seconds < 0) {
                $(current).parent().remove();
                clearInterval(interval);
            }
        }, 1000);
    });
});