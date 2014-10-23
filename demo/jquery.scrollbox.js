/**
 * @jQueryPlugin scrollbox
 *    Creates a custom scrollbar on an element for desktop and touchpad environments
 * @author marc.newport@ninelanterns.com.au
 * @dependencies jQuery, jQuery.mousewheel
 */
(function($) {
  $.fn.scrollbox = function(options) {
    return this.each(function() {
      //options are... optional
      options = options || {};
      
      //init some plugin globals
      var $this = $(this),
          width = 0,
          height = [],
          $content = [],
          $track = [],
          $handle = [],
          $document = [],
          contentHeight = 0,
          heightDiff = 0,
          handleHeight = 0,
          inited = false,
          contentScrollTop = 0,
          methods = {};
      
      
      /**
       * Creates the elements needed for the scrollbox
       */
      methods.init = function() {
        width = $this.width();
        height = $this.height();
        $content = $(document.createElement('div')).addClass('scrollbox-content');
        $track = $(document.createElement('div')).addClass('scrollbox-track');
        $handle = $(document.createElement('div')).addClass('scrollbox-handle');
        $document = $(document);
        //add a container inside
        $this.wrapInner($content);
        //listen for a heightChange event, this needs to be triggered manually
        $this.attr({ tabindex:0 }).bind('heightChange', methods.decide);
        //check if scrollbar is needed
        methods.decide();
      }
      
      
      
      /**
       * Decide if a scrollbar is needed
       */
      methods.decide = function() {
        
        var $clone = [],
            actualHeight = 0;
        
        //capture the content height
        $content = $this.find('.scrollbox-content');
        contentScrollTop = $content.scrollTop();
        $clone = $content.clone();
        $this.append($clone);
        
        actualHeight = $clone.attr('style', 'width:'+ width +'px').height();
        $clone.remove();
        delete $clone;
        
        contentHeight = $content.attr('style', 'width:'+ (width - 20) +'px').height();
        //is scrollbar needed?
        if (actualHeight > height) methods.setup();
        else methods.disable();
      }
      
      
      
      /**
       * insert the scrollbar
       */
      methods.setup = function() {
        //style this element
        $this.css({ overflow:'hidden', position:'relative' }).addClass('jquery-scrollbox');
        //style the track
        var trackStyles = {
            background:'#EEEEEE',
            border:'1px solid #EEEEEE',
            width: '10px',
            height: (height - 2) +'px',
            position: 'absolute',
            top: '0',
            right: '0',
            'border-radius': '5px'
        };
        $.extend(trackStyles, options.track);
        $track.css(trackStyles);
        
        //size the handle
        heightDiff = Math.floor((height / contentHeight) * 100);
        handleHeight = Math.round((heightDiff / 100) * height);
        
        if (handleHeight < 16) handleHeight = 16;
        if (handleHeight > 64) handleHeight = 64;
        
        var handleStyles = {
            background:'#666666',
            width: '10px',
            height: handleHeight +'px',
            cursor: 'pointer',
            'border-radius': '5px'
        };
        
        $.extend(handleStyles, options.handle);
        $handle.css(handleStyles);
        //style the content wrap
        $content.css({ position:'relative', overflow:'hidden', height:height +'px' });
        //insert the scroll bar
        $this.append($track.append($handle));
        
        //when instantiated, zero positions
        if (inited) {
          //get the new percentage
          var newPercent = Math.floor((contentScrollTop / (contentHeight - height)) * 100);
          methods.scroll('both', newPercent);
        }
        else {
          methods.scroll('both', 0);
        }
        
        //is touch supported?
        if ('ontouchstart' in window) {
          //TODO : listen for scrollbar touch drag
          //listen for content touchpad drag
          $content.get(0).addEventListener('touchstart', methods.touchpadDragHandler, false);
        }

        //listen for mousewheel move
        $this.bind('mousewheel', methods.mousewheelMoveHandler);
        //listen for scrollbar drag
        $handle.bind('mousedown', methods.scrollbarDragHandler);

        //inited after first setup
        inited = true;
      }
      
      
      
      /**
       * Handler for scrollbox mousewheel
       */
      methods.mousewheelMoveHandler = function(event, delta) {
        var amount = 0,
            top = 0,
            percent = 0;
            
        amount = (delta > 0) ? -10 : 10;
        top = $content.scrollTop() + amount;
        
        // rounding of numbers causes 0 percentages on big scrolling areas
        if(delta > 0){
          // round down with the up wheel
          percent = Math.floor((top / (contentHeight - height)) * 100);
        }
        else{
          // round up with the down wheel
          percent = Math.ceil((top / (contentHeight - height)) * 100);
        }
        
        methods.scroll('both', percent);
        return false;
      }
      
      
      
      /**
       * Handler for scrollbar handle drag
       */
      methods.scrollbarDragHandler = function(event) {
      
        var startY = event.pageY,
            currentY = 0,
            startPos = parseInt($(this).css('margin-top'), 10),
            currentPos = 0,
            percent = 0,
            l_false = function (){ return false;};
            
        //now that the handle has been clicked, listen for the mouse to move on the page
        //then remove that listener on mouse up and mouseout
        $document.bind('mousemove', function(event) {
          currentY = event.pageY;
          currentPos = startPos + Math.floor(currentY - startY);
          percent = (currentPos / (height - handleHeight)) * 100;
          methods.scroll('both', percent);
          //stop selection of text in ie
          if (document.attachEvent != undefined) document.attachEvent('onselectstart', l_false);
        })
        .mouseup(function() {
          $document.unbind('mousemove');
          if (document.attachEvent != undefined) document.detachEvent('onselectstart', l_false);
        })
        .find('body').mouseleave(function() {
          $document.unbind('mousemove');
        });
        return false;
      }
      
      
      
      /**
       * Scroll for ios touch
       */
      methods.touchpadDragHandler = function(event) {
        //prevent default touch screen behaviour
        event = event || window.event;
        
        //capture start positions
        var startY = event.touches[0].pageY,
            currentY = 0,
            startPos = parseInt($handle.css('margin-top'), 10),
            currentPos = 0,
            percent = 0,
            touchEndAdded = false,
            onTouchMove = function(tmEvent) {
              
              //prevent browser scroll
              tmEvent = tmEvent || window.event;
              
              //exit on two finger drag
              if (tmEvent.touches.length > 1) {
                $content.get(0).removeEventListener('touchmove', onTouchMove, false);
                return;
              }
              
              tmEvent.preventDefault();
              
              //TODO : prevent accidental clicks on a button while scrolling
              currentY = tmEvent.touches[0].pageY;
              currentPos = startPos - Math.floor(currentY - startY);
              percent = (currentPos / (height - handleHeight)) * 100;
              methods.scroll('both', percent);
              event.cancelBubble = true;
              
              if (event.stopPropagation) event.stopPropagation();
              //TODO : continue scrolling if "flicked"
            },
            onTouchEnd = function(teEvent) {
              //prevent accidental clicks on a button while scrolling
              if (! teEvent) var teEvent = window.event;
              
              teEvent.cancelBubble = true;
              
              if (teEvent.stopPropagation) teEvent.stopPropagation();
              
              $content.get(0).removeEventListener('touchmove', onTouchMove, false);
              $content.get(0).removeEventListener('touchend', onTouchEnd, false);
              //return false;
            };
            
        //listen for touchmove
        $content.get(0).addEventListener('touchmove', onTouchMove, false);
      }
      
      
      
      /**
       * Handles the scroll animation
       */
      methods.scroll = function(element, percent) {
        
        if (percent < 0) percent = 0;
        else if(percent > 100) percent = 100;
        
        //fire cusom event
        $this.trigger('scrolling');
        
        //decide element to scroll from parameter
        switch(element) {
          case 'both':
            methods.scroll('content', percent);
            methods.scroll('handle', percent);
            break;
            
          case 'content':
            var contentMax = contentHeight - height,
                contentTop = Math.floor(contentMax * (percent / 100));
                
            if (contentTop < 0) contentTop = 0;
            else if (contentTop > contentMax) contentTop = contentMax;
            $content.scrollTop(contentTop);
            break;
            
          case 'handle':
            var handleMax = height - handleHeight - 2,
                handleTop = Math.floor(handleMax * (percent / 100));
            if (handleTop < 0) handleTop = 0;
            else if (handleTop > handleMax) handleTop = handleMax;
            if (percent == 0){
              handleTop = 0;
            }
            $handle.css('margin-top', handleTop +'px');
            break;
            
          default:
            $.error('LOLWUT: jQuery.scrollbox() cant scroll that ['+ element +']');
            break;
        }
      }
      /**
       * removes the scrollbar and listeners
       */
      methods.disable = function() {
        //remove styles
        $this.attr('style', 'overflow:hidden').removeClass('jquery-scrollbox');
        
        $content.removeAttr('style');
        $track.removeAttr('style');
        $handle.removeAttr('style');
        
        //remove event listeners, not the change event though
        $this.unbind('mousewheel');
        $handle.unbind('mousedown');
        $document.unbind('mousemove');
        
        //is touch supported?
        if ('ontouchstart' in window) {
          $content.get(0).removeEventListener('touchstart', methods.touchpadDragHandler, false);
        }
      }
      
      
      
      /**
       * Removes all traces of the scrollbox plugin
       */
      methods.destroy = function() {
        var l_content = $this.find('.scrollbox_content').html();
        $this.removeClass('scrollbox').attr('style', 'overflow:hidden');
        $this.find('.scrollbox_content').remove();
        $this.html(l_content);
        $this.find('.track').remove();
        $this.find('.handle').remove();
        $this.unbind('mousewheel');
        $(document).unbind('mousemove');
      }
      /******************
       * End of methods *
       ******************/
       
       
       
      //call appropriate method based on the options given
      switch(typeof options) {
        case 'object':
          methods.init.call();
          break;
          
        case 'string':
          if (methods[options]) {
            methods[options].call();
          }
          else {
            $.error('LOLWUT: jQuery.scrollbox.('+  options +') method does not exist');
          }
          break;
          
        default:
          $.error('LOLWUT: jQuery.scrollbox.() does not recognise the parameter: '+ options);
          break;
      }
    });
  }
})(jQuery);
