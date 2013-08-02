(function ($) {
    "use strict";
    var MAX_IMAGES, FIRST_CLONE, LAST_CLONE, ANIMATING, DIRECT, AUTOPLAY;
    var maxWidth;
    var $this;

    $.fullsponsive = function (el, options) {
        // To avoid scope issues, use 'base' instead of 'this'
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("fullsponsive", base);

        // Imitate the Max Images at 0
        MAX_IMAGES = 0;
        ANIMATING = false;

        base.init = function () {

            base.$el.children('li').each(function () {
                if(!$(this).hasClass('spacer')) {
                    MAX_IMAGES++;
                }
            });

            base.options = $.extend({},$.fullsponsive.defaultOptions, options);

            // Get the max width of the slider
            if(base.options.maxWidth <= 1) {
              maxWidth = (base.options.maxWidth*100)+"%";
            } else {
            	maxWidth = base.options.maxWidth+"px";
            }

            // We copy the first image in the list, this makes the slider responsive and prevents it from losing its height which is set by the image.
            base.$el.prepend('<img class="spacer" src="'+base.$el.find('li:first > img').attr('src')+'" />');

            // Set the max width the the slider (they can do this with css too)
            base.$el.css({'width':maxWidth, 'margin':'0 auto'});

            // If we're using arrows, we need to do some extra setup
            if(base.options.controlType == 'arrows') {

                FIRST_CLONE = base.$el.find('li:first').clone();
                LAST_CLONE = base.$el.find('li:last').clone();

                base.$el.find('.spacer').after(LAST_CLONE);
                base.$el.append(FIRST_CLONE);

                base.$el.find('li:first').attr('data-clone',true);
                base.$el.find('li:last').attr('data-clone',true);

                base.positionID();
                base.positions(true);

                switch(base.options.direction) {
                    case "left-to-right" :
                        DIRECT = "right";
                        break;
                    case "right-to-left" :
                        DIRECT = "left";
                        break;
                    default:
                        DIRECT = "left";
                }
            } else {
                base.positionID();
                base.hideImages();
            }

            // Add the controls
            base.controlSetup(base.options.controlType);

            // Initiate Auto-Rotate
            if(base.options.autoPlay) {
                base.autoPlay(DIRECT);
            }

        };

        /**
        * @param string
        * Set up the default controls for the slider
        **/
        base.controlSetup = function (controller) {
            var totalImages = 0;
            var activePosition = "";

            base.$el.find('li').each(function () {
                totalImages++;
            });

            base.$el.prepend('<div id="fs-controls" />');
            switch(controller) {
                case "arrows" :
                    if(base.options.controlTemplate) {
                        base.$el.find('#fs-controls').prepend(base.options.controlTemplate);
                    } else {
                        base.$el.find('#fs-controls').prepend("<div class='fs-arrows left'><a href='#' id='fs-left'>&lt;</a></div> <div class='fs-arrows right'><a href='#' id='right' id='fs-right'>&gt;</a></div>");
                    }

                    break;

                case "dots" :
                    base.$el.find('#fs-controls').prepend('<ul class="fs-dots" />');

                    if(base.options.controlTemplate) {
                        // They should only be giving us whats inside the <li>
                        for(var i = 0; i < totalImages; i++) {
                            if(i == 0) { activePosition = "fs-active"; } else { activePosition = ""; }

                            base.$el.find('.fs-dots').append('<li><a href="#" id="fs-'+i+'">'+base.options.controlTemplate+'</a></li>');
                            base.$el.find('#fs-'+i).children().addClass(activePosition);
                        }
                    } else {
                        for(var i = 0; i < totalImages; i++) {
                            if(i == 0) { activePosition = "fs-active"; } else { activePosition = ""; }

                            base.$el.find('.fs-dots').append('<li><a href="#" id="fs-'+i+'"><div class="fs-dot '+activePosition+'"></div></a></li>');
                        }
                    }
                    break;

                case "thumbnail" :
                    var linkedIMG;

                    base.$el.find('#fs-controls').prepend('<ul class="fs-thumbnails" />');
                    for(var i = 0; i < totalImages; i++) {
                        if(i == 0) { activePosition = "fs-active"; } else { activePosition = ""; }

                        linkedIMG = base.$el.find('li[data-position="'+i+'"] > img').attr('src');
                        base.$el.find('.fs-thumbnails').append('<li><a href="#" id="fs-'+i+'"><div class="fs-thumbnail '+activePosition+'"><img src="'+linkedIMG+'" /></div></a></li>');
                    }
                    break;

                default:
                    base.$el.find('#fs-controls').prepend("<div class='fs-arrows left'><a href='#' id='fs-left'>&lt;</a></div> <div class='fs-arrows right'><a href='#' id='right' id='fs-right'>&gt;</a></div>");
                    base.options.controlType = "arrows";
                    break;
            }
        };

        /**
        * @param int, bool
        * Gets the incoming ID of the next image & update the controls & and run auto play (only called from thumbnails and dots)
        **/
        base.updateControls = function (activeID,replay) {
            base.$el.find('#fs-controls').find('li').each(function () {
                $(this).find('a').children().removeClass('fs-active');
            });
            base.$el.find('#fs-'+activeID).children().addClass('fs-active');

            if(replay) {
                base.autoPlay();
            }
        };

        /**
        * @param string
        * Run the image transition with optional direction.
        **/
        base.autoPlay = function (direction) {
            if(!direction) {
                direction = DIRECT;
            }

            if(base.options.autoPlay) {
                if(base.options.controlType == 'arrows') {
                    base.cloneCheck(true)
                    AUTOPLAY = setTimeout(function () {
                        base.rotateImages(direction);
                    },base.options.delay+base.options.transitionDuration);
                } else { // Fades
                    AUTOPLAY = setTimeout(function () {
                        base.fadeImages();
                    },base.options.delay+base.options.transitionDuration);

                }
            }
        }

        /**
        * @param string
        * Gets the incoming ID of the control that was clicked.
        **/
        base.incomingClick = function (clickID) {
            try {
                clearTimeout(AUTOPLAY);
            } catch(e) {
                console.log(e);
            }


            if(base.options.controlType == "arrows") {
                if(clickID.indexOf('left') >= 0) {
                    DIRECT = "right";

                    // We're moving to the left
                    base.rotateImages("right");

                } else if(clickID.indexOf('right') >= 0) {
                    DIRECT = "left";

                    // We're moving to the right
                    base.rotateImages("left");
                }
            } else {
                if(!base.$el.find('#'+clickID).children().hasClass('fs-active')) {
                    base.hideImages(clickID);
                }
            }
        }

        /**
        * @param bool,string
        * Checks for first time setup, and direction for update
        **/
        base.positionID = function () {
            var idex = 0;

            base.$el.children('li').each(function () {
                if(!$(this).hasClass('spacer')) {
                    $(this).attr('data-position',idex);
                    idex++;
                }
            });
        };

        /**
        * @param bool,string
        * Checks for first time setup, and direction for update
        **/
        base.positions = function (runTime) {
            var idex;

            if(runTime) {
                idex = 0;
                base.$el.children('li').each(function () {
                    if(!$(this).hasClass('spacer') && !$(this).data('clone')) {
                        $(this).css({'left':(100*idex)+'%'});
                        idex++;
                    }
                });
                base.$el.find('li:first').css({'left':-100+'%'});
                base.$el.find('li:last').css({'left':(100*idex)+'%'});
            }

            base.$el.children('li').each(function () {
                var $thisPos = $(this).position();

                if($thisPos.left <= 1 && $thisPos.left >= (-1)) {
                    $(this).attr('data-active',true);
                } else {
                    $(this).attr('data-active',false);
                }
            });

        };

        base.hideImages = function (specific) {
            if(!specific) {
                base.$el.find('li').each(function () {
                    $(this).hide();
                });

                base.$el.find('li:first').fadeIn(base.options.transitionDuration,base.options.easing);
            } else {
                var selID = specific.split('-'); selID = selID[1];


                base.$el.children('li').each(function () {
                    if($(this).is(':visible')) {
                        $(this).fadeOut(base.options.transitionDuration,base.options.easing);
                    }
                });

                setTimeout(function () {
                    base.$el.find('li[data-position="'+selID+'"]').fadeIn(base.options.transitionDuration,base.options.easing);
                },base.options.transitionDuration+1);

                base.updateControls(selID,true);
            }
        };

        // Rotate Image
        base.rotateImages = function (direction) {
            var leftPos = "";

            ANIMATING = true;

            base.$el.children('li').each(function () {
                if(!$(this).hasClass('spacer')) {
                    if(direction == "left") {
                        leftPos = "-=";
                    } else {
                        leftPos = "+=";
                    }

                    $(this).animate({
                        left: leftPos+100+"%"
                    },base.options.transitionDuration, base.options.easing, function () {
                        base.positions(false);
                    });
                }
            });

            // Delay the clone check so everything has time to update, if we're using arrows
            if(base.options.controlType == "arrows") {
                setTimeout(function () {
                    base.cloneCheck();
                    ANIMATING = false;
                },base.options.transitionDuration+10);
            }
        };

        base.fadeImages = function () {
            var nextID = (base.$el.children('li:visible').data('position'))+1;

            if(nextID == MAX_IMAGES) {
                nextID = 0;
            }

            base.$el.children('li:visible').fadeOut(base.options.transitionDuration,base.options.easing,function () {
                // Send the new ID to update the controls
                base.updateControls(nextID,true);

                base.$el.find('li[data-position="'+nextID+'"]').fadeIn(base.options.transitionDuration,base.options.easing);
            });
        };

        // Check for clones
        base.cloneCheck = function (redundant) {
            $this = base.$el.find('li[data-active="true"]');
            var check = $this.data('clone');
            var idex;

            if(check) {
                // It's a trap! We're on a clone!
                if($this.is('li:first')) {

                    idex = MAX_IMAGES;

                    // Remove the last <li>  (clone) to make positioning easier.
                    base.$el.find('li:last').remove();

                    // We need to position the LAST <li> to be at 0
                    base.$el.find('li').each(function () {
                        $(this).css({'left':100*(-idex)+'%'});

                        idex--;
                    });

                    // Re-add the last clone.
                    base.$el.append(FIRST_CLONE);
                    base.$el.find('li:last').attr('data-clone',true);
                    base.$el.find('li:last').css({'left':(100*(MAX_IMAGES-1))+'%'});

                } else {

                    idex = 0;

                    // Remove the first <li> (clone) to make positioning easier
                    base.$el.find('li:first').remove();

                    // We need to position the FIRST <li> to be at 0
                    base.$el.find('li').each(function () {
                        $(this).css({'left':(100*idex)+'%'});
                        idex++;
                    });

                    // Re-add the first clone
                    base.$el.find('.spacer').after(LAST_CLONE);
                    base.$el.find('li:first').attr('data-clone',true);
                    base.$el.find('li:first').css({'left':-100+'%'});
                }
                // Re-adjust the positions and active
                base.positions(false);
            }
            setTimeout(function () {
                if(redundant){
                    return true;
                } else {
                    base.autoPlay();
                }
            },5);
        };
        // Run initializer
        base.init();
    };

    $.fullsponsive.defaultOptions = {
        maxHeight: 550,					// INT (Default 550) : Max height of the slider in PX
        maxWidth: 1, 					// INT (Default 1) : Max width of the slider. in PX or % (if 0.1-1)
        easing: "easeOutQuart", 	    // String (Default easeOutQuart) : Requires jQuery UI
        autoPlay: true,					// Boolean (Default True) : Auto-cycle images
        delay: 5000,				    // INT (Default 5000) : Time between rotations in MS
        transitionDuration: 800,		// INT (Default 100) : Transition time in MS
        direction: "left-to-right",     // String (Default left-to-right) : Direction that the slider moves. Options: left-to-right, right-to-left (Arrows Only)
        controlType: "arrows",          // String (Default arrows) : Slider control type. Options: Arrows, Dots, Thumbnails
        captions: false,                // Boolean (Default False) : Display captions under the image (Div tag under the image)
        controlTemplate: ""             // String: The markup used for controls. See the documentation for more info on custom controls
    };

    $.fn.fullsponsive = function (options) {
        return this.each(function () {
            var fs = new $.fullsponsive(this, options);

            /* == Controls ===================================== */
            $('#fs-controls').find('a').click(function () {
                if(!ANIMATING) {
                    fs.incomingClick($(this).attr('id'));
                }
                return false;
            });
        });
    };
})(jQuery);

