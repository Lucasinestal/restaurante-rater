    var translate = function(text) {
        let string = text.toLowerCase();
        consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l','m', 'n', 'p', 'q', 'r', 's', 't', 'v', 'z', 'x'];
        let y = "";
        for (i = 0; i < string.length; i++) {
           let current = string.charAt(i); 
          if (consonants.indexOf(current) != -1) {
              y = (y + (current + 'o' + current));
          } else {
              y = (y + (current ));
          }
        }
        return y
      }
      
     console.log(translate("rövarspråket"))






