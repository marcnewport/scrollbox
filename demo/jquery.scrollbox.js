/**
 * @jQueryPlugin scrollbox
 *    Creates a custom scrollbar which is WCAG 2.0 AA compliant
 * @author marcnewport@gmail.com
 * @dependencies jQuery
 * @license GPLv2
 *
 * @todo use namespace for all events
 * @todo better commenting
 * @todo tidy up
 * @todo use preventDefault
 * @todo look into fake touch events as used in that other project
 * @todo mimic ios scroll??
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
          contentHeight = 0,
          $content = [],
          $track = [],
          $handle = [],
          $document = [],
          contentHeight = 0,
          heightDiff = 0,
          handleHeight = 0,
          inited = false,
          contentScrollTop = 0,
          dragging = false,
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
        $this.bind('heightChange', methods.decide);
        //check if scrollbar is needed
        methods.decide();
      };
      
      
      
      /**
       * Decide if a scrollbar is needed
       */
      methods.decide = function() {
        
        var $clone = [],
            actualHeight = 0;        
        
        //capture the content height
        $content = $this.find('.scrollbox-content');
        contentScrollTop = $content.scrollTop();
        actualHeight = $content.get(0).scrollHeight;
        contentHeight = $content.attr('style', 'width:'+ (width - 20) +'px').height();
        
        //is scrollbar needed?
        if (actualHeight > height) {
          methods.setup();
        }
        else {
          methods.disable();
        }
      };
      
      
      
      /**
       * insert the scrollbar
       */
      methods.setup = function() {

        var containerStyles = {},
            trackStyles = {},
            handleStyles ={},
            newPercent = 0;
      
        //style this element
        containerStyles = {
          overflow:'hidden',
          position:'relative'
        };

        $this.addClass('jquery-scrollbox').attr('tabindex', 0).css(containerStyles);
        
        //style the track
        trackStyles = {
          border:'1px solid #000000',
          width: '8px',
          height: (height - 2) +'px',
          position: 'absolute',
          top: '0',
          right: '0',
          borderRadius: '5px',
          opacity: 0.3
        };
        
        $.extend(trackStyles, options.track);
        $track.css(trackStyles);
        
        //size the handle
        heightDiff = Math.floor((height / contentHeight) * 100);
        handleHeight = Math.round((heightDiff / 100) * height);
        //but no smaller than 16px
        if (handleHeight < 16) handleHeight = 16;

        handleStyles = {
          background: '#000000',
          width: '8px',
          height: handleHeight +'px',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'margin 85ms'
        };
        
        $.extend(handleStyles, options.handle);
        $handle.css(handleStyles);
        
        //style the content wrap
        $content.css({
          position: 'relative',
          overflow: 'hidden',
          //height needed to use scrolltop
          height: height +'px',
          transition: 'margin 85ms'
        });
        
        //insert the scroll bar
        $this.append($track.append($handle));
        
        //when instantiated, zero positions
        if (inited) {
          //get the new percentage
          newPercent = Math.floor((contentScrollTop / (contentHeight - height)) * 100);
          methods.scroll('both', newPercent);
        }
        else {
          methods.scroll('both', 0);
        }
        
        //is touch supported?
        if ('ontouchstart' in window) {
          //listen for content touchpad drag
          $content.get(0).addEventListener('touchstart', methods.touchpadDragHandler, false);
        }

        //listen for hover
        $this.bind('mouseover', methods.mouseoverHandler);
        $this.bind('mouseout', methods.mouseoutHandler);

        //listen for mousewheel move
        $this.bind('DOMMouseScroll mousewheel', methods.mousewheelMoveHandler);
        
        //listen for scrollbar drag
        $handle.bind('mousedown', methods.scrollbarDragHandler);
        
        //listen for focus and arrow presses
        $this.bind('focus.scrollbox', methods.focusHandler);
        
        $track.bind('click.track', methods.trackClickHandler);

        //inited after first setup
        inited = true;
      };



      /**
       * Handler for scrollbox mouseover
       */
      methods.mouseoverHandler = function() {
        $track.stop().animate({ opacity:0.5 }, 200);
      };



      /**
       * Handler for scrollbox mouseout
       */
      methods.mouseoutHandler = function() {
        $track.stop().animate({ opacity:0.3 }, 200);
      };
      
      
      
      /**
       * Handler for scrollbox mousewheel
       *
       * @todo find velocity
       */
      methods.mousewheelMoveHandler = function(e) {
        
        var delta = e.originalEvent.detail,
            amount = (delta > 0) ? 15 : -15,
            top = 0,
            percent = 0;
        
        //deltaY is used for osx mouse pad
        if (e.originalEvent.deltaY) {
          amount = e.originalEvent.deltaY;
        }
        
        top = $content.scrollTop() + amount;
        
        // rounding of numbers causes 0 percentages on big scrolling areas
        if (amount < 0) {
          // round down with the up wheel
          percent = Math.floor((top / (contentHeight - height)) * 100);
        }
        else {
          // round up with the down wheel
          percent = Math.ceil((top / (contentHeight - height)) * 100);
        }
        
        methods.scroll('both', percent);
        e.preventDefault();
      };
      
      
      
      /**
       * Handler for scrollbar handle drag
       */
      methods.scrollbarDragHandler = function(event) {
      
        var startY = event.pageY,
            currentY = 0,
            startPos = parseInt($(this).css('margin-top'), 10),
            currentPos = 0,
            percent = 0,
            stop = function (){ return false };
        
        dragging = true;
            
        //now that the handle has been clicked, listen for the mouse to move on the page
        //then remove that listener on mouse up and mouseout
        $document.bind('mousemove', function(event) {
          currentY = event.pageY;
          currentPos = startPos + Math.floor(currentY - startY);
          percent = (currentPos / (height - handleHeight)) * 100;
          methods.scroll('both', percent);

          //stop selection of text in ie
          if (document.attachEvent != undefined) {
            document.attachEvent('onselectstart', stop);
          }
        })
        .mouseup(function() {
          $document.unbind('mousemove');

          if (document.attachEvent != undefined) {
            document.detachEvent('onselectstart', stop);
          }

          //wait a bit to say we're done
          setTimeout(function() { dragging = false }, 100);
        })
        .find('body').mouseleave(function() {
          $document.unbind('mousemove');
          //wait a bit to say we're done
          setTimeout(function() { dragging = false }, 100);
        });

        return false;
      };
      
      
      
      
      /**
       * Handler for scrollbox focus
       */
      methods.focusHandler = function(e) {
        
        var top = $content.scrollTop(),
            percent = 0,
            limit = contentHeight - height;
        
        //listen for some keys
        $(document).bind('keydown.scrollbox', function(ee) {
          
          switch(ee.which) {
            //pageup key
            case 33: top -= 120; break;
            //pagedown key
            case 34: top += 120; break;
            //end key
            case 35: top = limit; break;
            //home key
            case 36: top = 0; break;
            //up key
            case 38: top -= 15; break;
            //down key
            case 40: top += 15; break;
            //we don't care if any other button was pressed
            default: return;
          }
          
          //limit top
          if (top < 0) top = 0;
          if (top > limit) top = limit;
          
          percent = Math.round((top / (contentHeight - height)) * 100);
          methods.scroll('both', percent, true);
          ee.preventDefault();
        });

        $track.stop().animate({ opacity:0.5 }, 200);
        
        //once focus has left, unbind all those listeners
        $this.bind('blur.scrollbox', function() {
          $(document).unbind('keydown.scrollbox');
          $this.unbind('blur.scrollbox');
          //and return opacity back to original state
          $track.stop().animate({ opacity:0.3 }, 200);
        });
      };
      
      
      
      /**
       * Handler for clicking on the track
       */
      methods.trackClickHandler = function(e) {

        var top = 0,
            percent = 0;
        
        //continue if we're not dragging
        if (! dragging) {
          top = e.pageY - $track.offset().top;
          percent = Math.floor((top / $track.height()) * 100);
          methods.scroll('both', percent, true);
        }
      };
      
      
      
      /**
       * Scroll for ios touch
       */
      methods.touchpadDragHandler = function(e) {

        //prevent default touch screen behaviour
        e = e || window.event;
        
        //capture start positions
        var startY = e.touches[0].pageY,
            currentY = 0,
            startPos = parseInt($handle.css('margin-top'), 10),
            currentPos = 0,
            percent = 0,
            touchEndAdded = false,
            onTouchMove = function() {},
            onTouchEnd = function () {};

        onTouchMove = function(ee) {
          //prevent browser scroll
          ee = ee || window.event;
          
          //exit on two finger drag
          if (ee.touches.length > 1) {
            $content.get(0).removeEventListener('touchmove', onTouchMove, false);
            return;
          }
          
          ee.preventDefault();
          
          //TODO : prevent accidental clicks on a button while scrolling
          currentY = ee.touches[0].pageY;
          currentPos = startPos - Math.floor(currentY - startY);
          percent = (currentPos / (height - handleHeight)) * 100;
          methods.scroll('both', percent);
          e.cancelBubble = true;
          
          if (e.stopPropagation) e.stopPropagation();
          //TODO : continue scrolling if flicked
        };

        onTouchEnd = function(ee) {
          //prevent accidental clicks on a button while scrolling
          if (! ee) var ee = window.event;
          
          ee.cancelBubble = true;
          
          if (ee.stopPropagation) ee.stopPropagation();
          
          $content.get(0).removeEventListener('touchmove', onTouchMove, false);
          $content.get(0).removeEventListener('touchend', onTouchEnd, false);
          //return false;
        };
            
        //listen for touchmove
        $content.get(0).addEventListener('touchmove', onTouchMove, false);
      }
      
      
      
      /**
       * Handles the scroll animation
       *
       * @todo fire custom events at start and end
       * @todo smoother scrolling
       */
      methods.scroll = function(element, percent, animate) {

        var contentMax = 0,
            contentTop = 0,
            handleMax = 0,
            handleTop = 0;
        
        if (percent < 0) {
          percent = 0;
        }
        else if (percent > 100) {
          percent = 100;
        }
        
        //fire custom event
        $this.trigger('scrolling');
        
        //decide element to scroll from parameter
        switch(element) {
          case 'both':
            methods.scroll('content', percent, animate);
            methods.scroll('handle', percent, animate);
            break;
            
          case 'content':
            contentMax = contentHeight - height;
            contentTop = Math.floor(contentMax * (percent / 100));
                
            if (contentTop < 0) {
              contentTop = 0;
            }
            else if (contentTop > contentMax) {
              contentTop = contentMax;
            }
            
            if (animate) {
              $content.animate({ scrollTop:contentTop }, 10);
            }
            else {
              $content.scrollTop(contentTop);
            }
            
            break;
            
          case 'handle':
            handleMax = height - handleHeight - 2;
            handleTop = Math.floor(handleMax * (percent / 100));
                
            if (handleTop < 0) {
              handleTop = 0;
            }
            else if (handleTop > handleMax) {
              handleTop = handleMax;
            }
            
            if (percent == 0){
              handleTop = 0;
            }
            
            if (animate) {
              $handle.animate({ marginTop:handleTop }, 10);
            }
            else {
              $handle.css('margin-top', handleTop +'px');
            }
            break;
            
          default:
            $.error('LOLWUT: jQuery.scrollbox() cant scroll that ['+ element +']');
            break;
        }
      };
      
      
      
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
      };
      
      
      
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
      };
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
