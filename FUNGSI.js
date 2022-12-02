function test() {
  var data = ["a","b"]
  scriptProperties.setProperty('DATA_TEST', data.toString());
  
  // Logger.log(r);
}


  function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
    var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    var hours = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
    var minutes = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var hour = hours[a.getHours()];
    var minute = minutes[a.getMinutes()];
    var date = a.getDate();
    var time = date + '/' + month + '/' + year + ' ' + hour + ':' + minute;
    
    return time;
}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
