var scriptProperties = PropertiesService.getScriptProperties();
var token = 'bot token';

var ssid = "sheet id";
var sheetName = "test";

var webAppUrl = "deployment app";

var orderRegexPass = /\/T-AREA: (.*)\n\nPPoE: (\d+)\nNOMINAL: (\d+)\nKETERANGAN: (.+)/gmi;
var orderRegex = /:\s{0,1}(.+)/ig;

var errMsg = " ";

function ngisi(datas) {
  var sheet = SpreadsheetApp.openById(ssid).getSheetByName(sheetName);
  lRow = sheet.getLastRow();
  sheet.appendRow(datas);
  Logger.log(lRow);
}

function orderParsing(update) {
  
  var ret = errMsg;
  
  var msg = update.message;
  
  var str= msg.text;
  var match = str.match(orderRegex);
  
  if ( msg.chat.type == 'private' ) {
    ret = '🚫 Run In Group!';
  } else {
 
  
    if (match.length == 4) {
      for(var i=0; i < match.length; i++) {
        match[i] = match[i].replace(':', '').trim();
      }
  
    
      ret  = "📨 <b>"+match[0]+"</b>\n\n";
      ret += "📥 ORDER\n<code>" + match[1] + "</code>\n\n";
      ret += "☑️ <b>PPoE</b>\n 🔸 " + match[2] + "\n\n";
  
      ret += "🗃 <b>NOMINAL</b>\n";
      ret += " 🔹 KETERANGAN: "+match[3] + "\n";
  
      ret += "✅ Data saved successfully!";
  
      ret = "✅ The (your filename) report has been successfully saved.";
    
      var simpan = match;
      
      var nama = msg.from.first_name;      
      if (msg.from.last_name) { 
        nama += " " + msg.from.last_name;
      }      
      simpan.unshift(nama);
      
      var waktu = timeConverter(msg.date);
      simpan.unshift(waktu);
      
      simpan.unshift(msg.chat.title);
  
      ngisi(simpan);
    }
  }
  
  return ret;
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hey there!");
}

function doPost(e) {
  if(e.postData.type == "application/json") {
    
    var update = JSON.parse(e.postData.contents);
  
    var bot = new Bot(token, update);
    
    var bus = new CommandBus();
    bus.on(/\/start/i, function () {
      this.replyToSender("It works!");
    });
    bus.on(/^[\/!]ping/i, function () {
      this.forwardToSender("<b>Bots Work Properly!</b>");
    });
    bus.on(/^[\/!]tukinem/i, function () {
        this.replyToSender("\n\/T-AREA: \nPPoE: \nNOMINAL: \nKETERANGAN: -");
        this.forwardToSender("Please Copy");
      });
    bus.on(/^[\/!]your command/i, function () {
        this.replyToSender("this is to reply text");
        this.forwardToSender("this just below reply text");
      });
    
    bus.on(orderRegex, function () {
      var rtext = orderParsing(update); 
      this.replyToSender(rtext);
    });
   
    bot.register(bus);
 
    if (update) {
      bot.process();
    }
  } 
}

function setWebhook() {
  var bot = new Bot(token, {});
  var result = bot.request('setWebhook', {
    url: webAppUrl
  });
  Logger.log(ScriptApp.getService().getUrl());
  Logger.log(result);
}

function Bot (token, update) {
  this.token = token;
  this.update = update;
  this.handlers = [];
}

Bot.prototype.register = function ( handler) {
  this.handlers.push(handler);
}

Bot.prototype.process = function () {  
  for (var i in this.handlers) {
    var event = this.handlers[i];
    var result = event.condition(this);
    if (result) {
      return event.handle(this);
    }
  }
}

Bot.prototype.request = function (method, data) {
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };
  
  var response = UrlFetchApp.fetch('https://api.telegram.org/bot' + this.token + '/' + method, options);
    
  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  }
  
  return false;
}


Bot.prototype.replyToSender = function (text) {
  return this.request('sendMessage', {
    'chat_id': this.update.message.chat.id,
    'parse_mode' : 'HTML',
    'reply_to_message_id': this.update.message.message_id,
    'text': text
  });
}

Bot.prototype.forwardToSender = function (text) {
  return this.request('sendMessage', {
    'chat_id': this.update.message.chat.id,
    'parse_mode' : 'HTML',
    'forward_sender_name': this.update.message.message_id,
    'text': text
  });
}

function CommandBus() {
  this.commands = [];
}

CommandBus.prototype.on = function (regexp, callback) {
  this.commands.push({'regexp': regexp, 'callback': callback});
}

CommandBus.prototype.condition = function (bot) {
  return bot.update.message.text.charAt(0) === '/';
}

CommandBus.prototype.handle = function (bot) {  
  for (var i in this.commands) {
    var cmd = this.commands[i];
    var tokens = cmd.regexp.exec(bot.update.message.text);
    if (tokens != null) {
      return cmd.callback.apply(bot, tokens.splice(1));
    }
  }
  return bot.replyToSender(errMsg);
}
