var scriptProperties = PropertiesService.getScriptProperties();
var token = 'BOT TOKEN';

var ssid = "SHEET ID";
var sheetName = "SHEET NAME";

var webAppUrl = "https://script.google.com/macros/s/AKfycbxmh8YpoErySEhw-_AVqneGD5irTAitjMxN7jITBvLjRor3TevI0eG8_ttXntkSYgio/exec";

var orderRegexPass = /\/P-AREA: (.*)\n\nSALES: (.*)\n\nKONSUMEN: (\d+)\nNO HP: (\d+)\n\nMODEM: (\d+)\nKABEL: (\d+)\nLAIN LAIN: (\d+)\nKETERANGAN: (.+)/gmi;
var orderRegex = /:\s{0,1}(.+)/ig;

var errMsg = "Use the format.\
\n/pasang - untuk laporan pemasangan";

function ngisi(datas) {
  var sheet = SpreadsheetApp.openById(ssid).getSheetByName(sheetName);
  lRow = sheet.getLastRow();
  sheet.appendRow(datas);
  Logger.log(lRow);
}

function orderParsing(update) {
 // scriptProperties.setProperty('DATA_TEST', JSON.stringify(update));
  
  var ret = errMsg;
  
  var msg = update.message;
  
  var str= msg.text;
  var match = str.match(orderRegex);
  
  if ( msg.chat.type == 'private' ) {
    ret = '🚫 Run in Group!';
  } else {
 
  
    if (match.length == 8) {
      for(var i=0; i < match.length; i++) {
        match[i] = match[i].replace(':', '').trim();
      }
  
    
      ret  = "📨 <b>"+match[0]+"</b>\n\n";
      ret += "📥 ORDER\n<code>" + match[1] + "</code>\n\n";
      ret += "☑️ <b>SALES</b>\n 🔸 " + match[2] + "\n\n";
  
      ret += "🗃 <b>KONSUMEN</b>\n";
      ret += " 🔹 NO HP: "+match[3] + "\n";
      ret += " 🔹 MODEM: "+match[4] + "\n";
      ret += " 🔹 KABEL: "+match[5] + "\n";
      ret += " 🔹 LAIN LAIN: "+match[6] + "\n";
      ret += " 🔹 KETERANGAN: "+match[7] + "\n";
  
      ret += "✅ Data berhasil disimpan!";
  
      ret = "✅ Laporan Pemasangan berhasil disimpan.";
    
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
  // Make sure to only reply to json requests
  if(e.postData.type == "application/json") {
    
    // Parse the update sent from Telegram
    var update = JSON.parse(e.postData.contents);// Instantiate the bot passing the update 
  
    // Instantiate our bot passing the update 
    var bot = new Bot(token, update);
    
    // Building commands
    var bus = new CommandBus();
    bus.on(/\/start/i, function () {
      this.replyToSender("It works!");
    });
    bus.on(/^[\/!]ping/i, function () {
      this.forwardToSender("<b>Bot Is Working!</b>");
    });
    bus.on(/^[\/!]pasang/i, function () {
      this.replyToSender("\n\/P-AREA: -\ \nSALES: -\ \nKONSUMEN: -\ \nNO HP: -\ \nMODEM: -\ \nKABEL: -\ \nLAIN LAIN: -\ \nKETERANGAN: -");
      this.forwardToSender("Copy text");
    }
    
    bus.on(orderRegex, function () {
      var rtext = orderParsing(update); 
      this.replyToSender(rtext);
    });
   
    // Register the command bus
    bot.register(bus);
 
    // If the update is valid, process it
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
