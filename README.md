# scrollbox
jQuery extension for a custom scrollbar that looks consistent across browsers and devices which is WCAG friendly

##Use
    //init scrollbox
    $('.scrollbox').scrollbox();
    
    //remove scrollbox
    $('.scrollbox').scrollbox('destroy');
    
    //customise styles
    $('.scrollbox').scrollbox({
      track: {
        background: '#00FF00'
      },
      handle: {
        background: '#0000FF'
      }
    });
