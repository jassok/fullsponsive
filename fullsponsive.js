/** fullsponsive.js
  * Responsive full screen or controlled width image slider.
  * Version 1.0
  * 12/4/2013
  */

(function($) {
    'use strict';

    var CAPTIONTMPLATE, CONTROLTEMPLATE;

    $.fullsponsive = function(el, options){
        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("fullsponsive", base);



        /** Requirements
          * 1) Preload images with ajax loader
          * 2) Check if there are enough images to require controls
          * 3) Order, and place images in the slider
          * 4) Position the images
          *     a) "placeholder" image to manage the size
          * 5) Build out controls
          *     a) arrows, buttons, thumbnails
          *          I) Allow for support of multiple.
          *         II) Support for incoming commands
          *     b) Caption system
          *     c) Call back system
          * 6) Options
          */

          /** Operations, One Image
            * 1) Place Ajax image up.
            *     a) Replace with first Image
            * 2) Count images in the slider
            *     a) If <= 1 Image: Do nothing to controls, simply position the image
            *
            ** Operations, Multi Images
            * 1) [Previous Steps]
            * 2) If > 1 Image
            *     a) Pull out the first image as a placeholder, and move it to the side
            *     b) Clone the first li, and move it to the end.
            *     c) Clone the second li, and place it at the start.
            *
            ** Control types
            * 1) Auto Play (timer)
            * 2) Slide Image (direction, position)
            *     a) Takes a direction or false, and a position or false,
            *         I) If no direction is set, but a position is (thumbnails) take the closest path to that image.
            *        II) If a direction, can't have a position. Rotate in that direction on the slider
            *       III) Check if we're on a clone, if we are; go to the start or finish of the list respectively.
            *     b) Clears the auto play out, then restarts it.
            * 2) Fade Images (directions, position)
            *     a) Takes a direction or false, and a position or false
            *         I) If a direction, moves that way in the list
            *        II) If a position, moves to that image.
            */



        /* == Functions ====================================== */

        /** init
          * Preload, get set options, check if there are enough images
          * call the necessary functions to proceed.
          */
        base.init = function () {
            base.options = $.extend({},$.fullsponsive.defaultOptions, options);

            base.$el.addClass("fs-slider");

            // Check for Templates
            if(base.options.captionsTemplate) {
                if(base.$el.find(base.options.captionsTemplate).length < 1) {
                    console.warn('Fullsponsive.js: You set a template, but we couldn\'t find it. Make sure you have a div set with the ID or class of: ' + base.options.captionsTemplate);
                } else {
                    CAPTIONTMPLATE = base.$el.find(base.options.captionsTemplate).clone();
                    base.$el.find(base.options.captionsTemplate).remove();
                }
            }

            if(base.options.controlTemplate) {
                if(base.$el.find(base.options.controlTemplate).length < 1) {
                    console.warn('Fullsponsive.js: You set a template, but we couldn\'t find it. Make sure you have a div set with the ID or class of: ' + base.options.controlTemplate);
                } else {
                    CONTROLTEMPLATE = base.$el.find(base.options.controlTemplate).clone();
                    base.$el.find(base.options.controlTemplate).remove();
                }
            }
            // End check for templates

            // check minimum images
            if(base.$el.children('li').size() <= 1) {
                base.$el.find('li').first().css({'position':'relative'});
                return false;
            }
            // end max image check

            //Create Clones
            var firstClone, lastClone;

            firstClone = base.$el.find('li').last().clone().addClass('fs-cloneImage');
            lastClone = base.$el.find('li').first().clone().addClass('fs-cloneImage');

            base.$el.append(lastClone);
            base.$el.prepend(firstClone);
            // End clone creation

            // Begin Image placement
            base.$el.find('li').each(function () {
                var floatPosition = 100*($(this).index() - 1);
                $(this).addClass('fs-trueImage').css({'position':'absolute','top':'0','left':floatPosition+'%'});
            });
            // End Image placement

            // Begin placeholder
            var smallestSRC = base.$el.find('li > img').first();

            base.$el.find('li').each(function () {
                if($(this).find('img').height() < smallestSRC.height()) {
                    smallestSRC = $(this).find('img');
                }
            });

            base.$el.prepend(smallestSRC.clone().css({"position":"relative","margin-left":"-1000%"}).addClass('fs-placeholder'));
            // End placeholder

            firstClone.removeClass('fs-trueImage');
            lastClone.removeClass('fs-trueImage');


            // Set the controlls
            if(base.options.controlType.indexOf('|') > 0) {
                var parts = base.options.controlType.split('|');
                for(var i = 0; i < parts.length; i += 1) {
                    base.setControls(parts[i]);
                }
            } else {
                base.setControls(base.options.controlType);
            }
            // End the controlls


            // Set the caption
            if(base.options.captions) {
                base.callout(base.getActiveImage(),true);

            }
            // End captions
        };

        base.setControls = function (controller) {
            switch(controller) {
                case 'arrows' :

                    if(CONTROLTEMPLATE) {
                        CONTROLTEMPLATE.addClass('fs-controller-arrows');
                        CONTROLTEMPLATE.find('#fs-left').addClass('fs-control');
                        CONTROLTEMPLATE.find('#fs-right').addClass('fs-control');
                        base.$el.find('.fs-placeholder').after(CONTROLTEMPLATE);
                        base.$el.find('.fs-controller-arrows').css({'position':'absolute','z-index':15});
                    } else {
                        base.$el.find('.fs-placeholder').after('<div class="fs-controller-arrows" />');
                        base.$el.find('.fs-controller-arrows').append('<div class="fs-control" id="fs-left"><div class="fs-left-arrow"><i class="icon-left-open"></i></div></div>');
                        base.$el.find('.fs-controller-arrows').append('<div class="fs-control" id="fs-right"><div class="fs-right-arrow"><i class="icon-right-open"></i></div></div>');
                        base.$el.find('.fs-controller-arrows').css({'position':'absolute','z-index':15,'top':'45%','width':'100%'});
                    }


                    break;
                case 'thumbnails' :

                    if(CONTROLTEMPLATE) {
                        // TODO : Add custom Thumbnails Settings
                    } else {
                        base.$el.find('.fs-placeholder').after('<div class="fs-controller-thumbnails" />');
                        base.$el.find('.fs-controller-thumbnails').append('<ul id="fs-thumbnails">');

                        base.$el.find('li').each(function () {
                            if($(this).hasClass('fs-trueImage')) {
                                base.$el.find('.fs-controller-thumbnails > #fs-thumbnails').append('<li class="fs-control fs-thumb"><img src="'+$(this).find('img').attr('src')+'" /></li>');
                            }
                        });

                        base.$el.find('.fs-controller-thumbnails').append('</ul>');
                    }
                    base.$el.find('#fs-thumbnails > li').first().addClass('fs-active');
                    break;
                case 'dots' :
                    if(CONTROLTEMPLATE) {
                        // TODO : Add custom dot settings
                    } else {
                        base.$el.find('.fs-placeholder').after('<div class="fs-controller-dots" />');
                        base.$el.find('.fs-controller-dots').append('<ul id="fs-dots">');

                        base.$el.find('li').each(function () {
                            if($(this).hasClass('fs-trueImage')) {
                                base.$el.find('.fs-controller-dots > #fs-dots').append('<li class="fs-control fs-dot"><i class="icon-dot"></i></li>');
                            }
                        });
                        base.$el.find('.fs-controller-dots').append('</ul>');
                    }

                    base.$el.find('#fs-dots > li').first().addClass('fs-active');
                    break;
                default:
                    base.setControls('arrow');
                    break;
            }
        };

        base.callout = function ($element, showHide) {
            if(showHide) {
                var caption = $element.find('img').data("callout");

                if(base.options.captionsTemplate) {
                    // TODO : Add custom captions
                } else {
                    $element.prepend('<div class="fs-callout clearfix"><h2>'+caption+"</h2></div>");
                    var calloutWidth = $element.find('.fs-callout').width();
                    var centered = (base.$el.width() - calloutWidth);
                    centered = ((centered / 2)/base.$el.width())*100;
                    $element.find('.fs-callout').css('left',centered+'%');

                    $element.find('.fs-callout').delay(base.options.captionsDelay).fadeIn(base.options.transitionDuration,base.options.captionsEasing);
                }
            } else {
                $element.find('.fs-callout').fadeOut();
            }

        };

        base.autoPlay = function () {

        };

        base.rotateImages = function (direction, position) {
            var movement;
            var $active = base.getActiveImage();

            if($active.find('.fs-callout').is(':visible')) {
                base.callout($active,false);
            }

            if(direction) {
                if(direction.indexOf('left') > 0) {
                    movement = "+=";
                } else if(direction.indexOf('right') > 0) {
                    movement = "-=";
                } else {
                    movement = "+=";
                }

                base.$el.find('li').each(function() {
                    $(this).animate({
                        left: movement+100+"%"
                    },base.options.transitionDuration,base.options.easing);
                });

                setTimeout(function () {
                    base.cloneCheck();
                    base.callout(base.getActiveImage(),true);
                },base.options.transitionDuration);

            } else {
                // Change based on position
            }
        };

        base.fadeImages = function (direction, position) {

        };

        base.cloneCheck = function () {
            var $active = base.getActiveImage();
            if($active.hasClass('fs-cloneImage')) {

                if($active.index('li') === 0) {
                    // Beginning of the list
                    base.reposition(false);
                } else {
                    // End of the list
                    base.reposition(true);
                }
            }

        };

        base.getActiveImage = function () {
            var result = false;

            base.$el.find('li').each(function () {
                var position = $(this).position();

                if(position.left === 0 || position.left > (0-2) && position.left < 2) {
                    result = $(this);
                }
            });

            return result;
        };


        base.reposition = function (first) {
            if(first) { // go to the beginning of the list
                base.$el.find('li').each(function () {
                    $(this).css('left',100*($(this).index('li')-1)+"%");
                });
            } else {  // go to the end of the list
                var maxImages = (base.$el.find('li').length)-1;

                base.$el.find('li').each(function () {
                    $(this).css('left',(-100)*(maxImages - $(this).index('li')-1)+"%");
                });
            }

        };

        base.incomingInteraction = function (interactionDirection, interactionPosition) {
            if(base.options.rotationType == 'fade') {

            } else {
                if(interactionDirection) {
                    base.rotateImages(interactionDirection);
                } else {
                    base.rotateImages(interactionDirection,interactionPosition);
                }
            }

        };



        base.init();
    };

    $.fullsponsive.defaultOptions = {
        easing: "easeOutQuart",             // String: Requires jQuery UI
        autoPlay: true,                     // Boolean: Auto-cycle images on load
        delay: 5000,                        // INT: Time between rotations in MS
        transitionDuration: 800,            // INT: Transition time in MS
        rotationType: 'left-to-right',      // String: Direction slider moves, options: left-to-right, right-to-left, fade
        controlType: 'arrows',              // String: type of slider controls, options: arrows, dots, thumbnails. Separate by | for multiple.
                                            //   Arrows Require .left and .right
                                            //   Thumbnails and dots, only include a single instance.
        controlTemplate: '',                // String: ID of the div template *
        captions: false,                    // Boolean: Display image captions or not, loads data-caption tag.
        captionsDelay: 300,                 // INT: Delay for caption to show after transition animation completes.
        captionsEasing: 'easeOutQuart',     // String: Requires jQuery UI
        captionsTemplate: ''                // String: ID of the div template *
        // * Note: Mose of these styles can be adjusted in the css.
    };

    $.fn.fullsponsive = function(options){
        return this.each(function(){
            var fs = new $.fullsponsive(this, options);

            $('.fs-control').click(function () {
                fs.incomingInteraction($(this).attr('id'),$(this).index());
                return false;
            });
        });
    };

})(jQuery);