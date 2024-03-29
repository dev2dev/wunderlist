/**
 * wunderlist.js
 *
 * Main Wunderlist core containing some helper functions
 * and the initialization of the program
 * 
 * @author Christian Reber, Dennis Schneider, Daniel Marschner
 */
var wunderlist = wunderlist || {};

/**
 * Init the wunderlist framework and all necessary parts
 *
 * @author Daniel Marschner
 */
wunderlist.init = function() {
	// Set the app title
	wunderlist.setTitle('Wunderlist' + (wunderlist.account.isLoggedIn() && wunderlist.account.email != '' ? ' - ' + wunderlist.account.email : ''));
	
	// Set the os version
	wunderlist.os = Titanium.Platform.name.toLowerCase();
	wunderlist.version = Titanium.App.version.toString();
	
	wunderlist.language.init();
	
	// Create the database structure
	wunderlist.database.init();
	
	settings.init();
		
	wunderlist.sync.init();
		
	// Init some other necessary stuff
	// TODO: add the wunderlist prefix
	wunderlist.account.init();
	wunderlist.timer.init();
	menu.initializeTrayIcon();
	wunderlist.sharing.init();
	wunderlist.notifications.init();
	share.init();
	
	// Check for a new version
	wunderlist.updater.checkVersion();	
	
	// Add the wunderlist object to the current window
	Titanium.UI.getCurrentWindow().wunderlist = wunderlist;
};

/**
 * Set the app title
 *
 * @author Daniel Marschner 
 */
wunderlist.setTitle = function(title) {
	document.title = title;
};

/**
 * Converted from PHP in_array()
 *
 * @author Daniel Marschner
 */
wunderlist.in_array = function(needle, array){
    for (var ix = 0; ix < array.length; ix++)
    {
        if (needle.toString() == array[ix])
            return true
    }
    
    return false;
};

/**
 * Check if the given value is an array
 *
 * @author Daniel Marschner
 */
wunderlist.is_array = function(value) {
	if (typeof value === 'object' && value && value instanceof Array)
		return true;

	return false;
};

/**
 * Calculates the difference between the current and the given date
 *
 * @author Dennis Schneider
 */
wunderlist.calculateDayDifference = function(done) {
	var today         = new Date();
	var one_day       = 86400; // One day in seconds
	var unceiled_days = ((today.getTime() / 1000) - done) / (one_day);

	if (unceiled_days > 1)
		// Calculate difference btw the two dates, and convert to days
		return Math.floor(unceiled_days);
	else
		return 0;
};

/**
 * Removes HTML Tags
 *
 * @author Dennis Schneider
 */
wunderlist.strip_tags = function(input, allowed) {
	allowed = (((allowed || "") + "")
		.toLowerCase()
		.match(/<[a-z][a-z0-9]*>/g) || [])
		.join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
	commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
	return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1)
	{
		return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
	});
};

/**
 * Replace a link in a given text with a clickable link
 *
 * @author Dennis Schneider, Marvin Labod
 */
wunderlist.replace_links = function(text) {
	// HTTP/HTTPS/FTP Links
	var exp = /((http|https|ftp):\/\/[\w?=&.\-\/-;#~%-\ü\( \)]+(?![\w\s?&.\/;#~%"=-]*>))/g;
	text = text.replace(exp,"<a href='$1'>$1</a>");
	
	// FILE Links (Windows)
	var exp = /(file:\/\/\/[a-zA-Z]:\/)(\w.+)\.([a-zA-Z0-9]{1,5})/g;
	text = text.replace(exp,"<span class='openApp'>$1$2.$3</span>");
	
	// Local File System Links (Mac)
	var exp = /(^|\s)(\/\w.+)\.([a-zA-Z0-9]{1,5})/g;
	text = text.replace(exp,"<span class='openApp'>$1$2.$3</span>");
	
	// Email addresses
	var exp = /(([a-z0-9*._+]){1,}\@(([a-z0-9]+[-]?){1,}[a-z0-9]+\.){1,}([a-z]{2,4}|museum)(?![\w\s?&.\/;#~%"=-]*>))/g;
	text = text.replace(exp, '<a href="mailto:$1">$1</a>' );
	
	return text;
};

/**
 * Replace the normal line break after enter it into a textarea to the HTML line break tag
 *
 * @author Marvin Labod
 */
wunderlist.replace_breaks = function(text) {
	return text.replace(/\n/g, '<br>');
}; 

/**
 * Replace the search string with the given string
 *
 * @author Daniel Marschner
 */
wunderlist.str_replace = function(search, replace, subject) {
	return subject.split(search).join(replace);
};

/**
 * Validates an integer
 *
 * @author Christian Reber
 */
wunderlist.is_integer = function(s) {
	return (s.toString().search(/^-?[0-9]+$/) == 0);
};

/**
 * Validate the email
 *
 * @author Dennis Schneider
 */
wunderlist.is_email = function(email) {
	var reg = /^([A-Za-z0-9\+_\-\.\+])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	
	if (reg.test(email) == false) 
	{
		$('.error').text(wunderlist.language.data.error_invalid_email);
		return false;
	}
	else 
		return true;
};

/**
 * Clean the string -> HTML or script
 *
 * Ported by: slamidtfyn
 * More info at: www.soerenlarsen.dk/development-projects/xss-clean
 */
wunderlist.xss_clean = function(str) {
	str = wunderlist.database.convertString(str);
	str = str.replace(/\\0/gi, '')
	str = str.replace(/\\\\0/gi, '')
	str = str.replace(/#(&\#*\w+)[\x00-\x20]+;#u/g,"$1;")
	str = str.replace(/#(&\#x*)([0-9A-F]+);*#iu/g,"$1$2;")
	str = str.replace(/%u0([a-z0-9]{3})/gi, "&#x$1;")
	str = str.replace(/%([a-z0-9]{2})/gi, "&#x$1;")   
	
	results = str.match(/<.*?>/g, str)
	
	if (results) 
	{	
		var i
		for (i = 0; i < results.length; i++) 
		{
			str = str.replace(results[i], wunderlist.html_entity_decode(results[i]));
		}
	}
	        
	str = str.replace(/\\t+/g, " ")
	str = str.replace(/<\?php/g,'&lt;?php');
	str = str.replace(/<\?PHP/g,'&lt;?PHP');
	str = str.replace(/<\?/g,'&lt;?');
	str = str.replace(/\?>/g,'?&gt;');
	words = new Array('javascript', 'vbscript', 'script', 'applet', 'alert', 'document', 'write', 'cookie', 'window');
	
	for (t in words)
	{
		temp = '';
		for (i = 0; i < words[t].length; i++)
		{
			temp += words[t].substr( i, 1)+"\\s*";
		}
		
		temp = temp.substr( 0,temp.length-3);
		myRegExp = new RegExp(temp, "gi")
		str = str.replace(myRegExp, words[t]);
	}
	
	str = str.replace(/\/<a.+?href=.*?(alert\(|alert&\#40;|javascript\:|window\.|document\.|\.cookie|<script|<xss).*?\>.*?<\/a>/gi,"")
	str = str.replace(/<img.+?src=.*?(alert\(|alert&\#40;|javascript\:|window\.|document\.|\.cookie|<script|<xss).*?\>/gi,"");
	str = str.replace(/<(script|xss).*?\>/gi,"")
	str = str.replace(/(<[^>]+.*?)(onblur|onchange|onclick|onfocus|onload|onmouseover|onmouseup|onmousedown|onselect|onsubmit|onunload|onkeypress|onkeydown|onkeyup|onresize)[^>]*>/gi,"$1");
	str = str.replace(/<(\/*\s*)(alert|applet|basefont|base|behavior|bgsound|blink|body|embed|expression|form|frameset|frame|head|html|ilayer|iframe|input|layer|link|meta|object|plaintext|style|script|textarea|title|xml|xss)([^>]*)>/ig, "&lt;$1$2$3&gt;");
	str = str.replace(/(alert|cmd|passthru|eval|exec|system|fopen|fsockopen|file|file_get_contents|readfile|unlink)(\s*)\((.*?)\)/gi, "$1$2&#40;$3&#41;");
	bad = new Array('document.cookie','document.write','window.location',"javascript\s*:","Redirect\s+302")
	
	for (val in bad)
	{
		myRegExp = new RegExp(bad[val], "gi")
		str = str.replace(myRegExp, bad[val]);   
	}
	
	str = str.replace(/<!--/g,"&lt;!--")
	str = str.replace(/-->/g,"--&gt;")
	
	return str
};

/**
 * Scans for a date in a task and returns a result object
 *
 * @author Dennis Schneider
 * @author Adam Renklint
 */
wunderlist.smartScanForDate = function(string) {

    // Add the year
    // Do it in German (or multiple languages)

	function capitaliseFirstLetter(str)
	{
	    return str.charAt(0).toUpperCase() + str.slice(1);
	}
	
    // In 2 weeks? In 14 days?
    var inType = false;

    // Search for a valid string in the format : on 21st of May | on 21 of May | on 21 May ...
    //var monthDateReg  = /\bon\s([1-9]*)(st|nd|rd|th)?\s\bof?\s?\b(January|February|March|April|May|June|July|August|September|October|November|December)/i;
	var monthDateReg  = /\bon\s([0-9]*)(st|nd|rd|th)?\s\b(of)?\s?\b(January|February|March|April|May|June|July|August|September|October|November|December)/i;
	
	// Apply the regex and replace the old string
	var result        = string.match(monthDateReg);
	
	// Search for a valid string in the format: on may 21
	var alternateMonthDateReg = /\bon\s\b(January|February|March|April|May|June|July|August|September|October|November|December)\s\b([0-9]*)/i;
	
	var alternateMonthDateRegMatch = false;
	if (result == null) {
		result = string.match(alternateMonthDateReg);
		alternateMonthDateRegMatch = true;
	}
	
	// Search for a valid string in the format: +1d | +2w | +3m | +4y
	var shortcutDateReg = /\+([0-9]*)(d|w|m|y)/i;
	if (result == null) {
		var intervalTypes = {
			y: 		'year',
			year: 	'year',
			d: 		'day',
			day: 	'day',
			m: 		'month',
			month: 	'month',
			w: 		'week',
			week: 	'week'
		}			
		string = string.replace(/\+(\d+)(w(eek)?|d(ay)?|m(onth)?|y(ear)?)/, function(match, count, interval) {
			var suffix = 's';
			if (count < 2) {
				suffix = '';
			}
			return "in " + count + " " + intervalTypes[interval] + suffix;
		})
	}

    // Search for a valid string in the format : in 2 weeks | in 14 days ...
    var weekDaysReg   = /\bin\s([1-9]*)\s\b(days?|weeks?|months?|years?)/;
    
    // Is it a normal string containing tomorrow or today?
    var todayTomorrow = false;    
    
    if (result == null && string.match(weekDaysReg) != null)
    {
        result = string.match(weekDaysReg);
        inType = true;
    }
    
    var string = (result != null) ? string.replace(result[0], '') : string;        
    
    // The json object containing the date information and the sanitized string
    var jsonDate      = { 'day' : 0, 'month' : 0, 'year' : 0, 'string' : string };
    
    // The current date
    var newDate       = new Date();
    
    if (inType == true)
    {
        var number = parseInt(result[1]);
        if (number == 0)
        {
            number = 1;
        }
        var type   = result[2];
        
        if (type == 'day' || type == 'days')
        {
            newDate.setDate(newDate.getDate() + number);
        }
        else if (type == 'week' || type == 'weeks')
        {
            newDate.setDate(newDate.getDate() + 7 * number);
        }
        else if (type == 'month' || type == 'months')
        {
            newDate.setMonth(newDate.getMonth() + number);
        }
        else if (type == 'year' || type == 'years')
        {
            newDate.setFullYear(newDate.getFullYear() + number);
        }
        
        result    = [];
        result[0] = '';
        result[1] = newDate.getDate();
        result[2] = html.getMonthName(newDate.getMonth());
    }

    if (inType == false)
    {
        if (string.search(wunderlist.language.data.tomorrow.toLowerCase()) != -1)
        {
            result             = [];
            result[0]          = 0;
            result[1]          = newDate.getDate() + 1;
            result[2]          = html.getMonthName(newDate.getMonth());
            todayTomorrow      = true;
            jsonDate['string'] = jsonDate['string'].replace(wunderlist.language.data.tomorrow.toLowerCase(), '');
        }
        
        if (string.search(wunderlist.language.data.today.toLowerCase()) != -1)
        {
            result             = [];
            result[0]          = 0;
            result[1]          = newDate.getDate();
            result[2]          = html.getMonthName(newDate.getMonth());
            todayTomorrow      = true;        
            jsonDate['string'] = jsonDate['string'].replace(wunderlist.language.data.today.toLowerCase(), '');        
        }
    } 
    
    //if (result == null) result = [];
	if (!result) {
		return {};
	}
    
	if (inType) {
		jsonDate['day']   = result[1];
		jsonDate['month'] = capitaliseFirstLetter(result[2]);
		jsonDate['year']  = newDate.getFullYear();
	} else if (alternateMonthDateRegMatch) {
	    jsonDate['day']   = result[2];
	    jsonDate['month'] = capitaliseFirstLetter(result[1]);
	    jsonDate['year']  = newDate.getFullYear();
	} else {
		jsonDate['day']   = result[1];
		jsonDate['month'] = (todayTomorrow == true) ? result[2] : capitaliseFirstLetter(result[result.length - 1]);
		jsonDate['year']  = newDate.getFullYear();
	}

	var validatedDate = new Date(jsonDate['month'] + ' ' + jsonDate['day'] + ', ' + jsonDate['year']);
	var nowDate = new Date();
	if (nowDate > validatedDate) {
		jsonDate['year']++;
	}
    
    return jsonDate;
};

/**
 * Is needed for the function xss_clean
 *
 * Ported by: slamidtfyn
 * More info at: www.soerenlarsen.dk/development-projects/xss-clean
 */
wunderlist.html_entity_decode = function(str) {
	var ta = document.createElement("textarea");
  	ta.innerHTML = str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
  	
  	result = ta.value;
  	result = result.replace(/&#x([0-9a-f]{2,5})/g, String.fromCharCode("$1"));
  	result = result.replace(/&#([0-9]{2,4})/g, String.fromCharCode("$1"));
  	
  	return result;		
};

/**
 * Put the first char of the string into upper case
 *
 * @author Daniel Marschner
 */
wunderlist.ucfirst = function(str) {
    str += '';
    var f = str.charAt(0).toUpperCase();
    return f + str.substr(1);
};

/*************************************************************************************/
// Start the wunderlist framework
$(function() { wunderlist.init(); });