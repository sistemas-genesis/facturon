
    $('tr[data-href]').on("click", function() 
    {
        document.location = $(this).data('href');
    });

    $('.side-nav').click(function()
    {
        $('.drag-target').click();

    });

    $( document ).ready(function()
    {
        $(".modal-trigger").leanModal();
        $(".button-collapse").sideNav();
        $(".datepicker").pickadate({
            closeOnSelect: true,
            format: "dd/mm/yyyy"
          });
        
    });
    // if ( $(window).width() > 992) 
    // {      
    //     $('#navMenu').addClass('fixed');
    //     $('.brand-logo').css('padding-left', '300px');
    //     $('.container').css('padding-left', '300px');
    // }    
    // else
    // {
    //     $('#navMenu').removeClass('fixed');
    //     $('.brand-logo').css('padding-left', '0');
    //     $('.container').css('padding-left', '0'); 
    // }

    function closeModal (modal)
    {
        $('#'+modal).closeModal();
    }

    function openModal(modal)
    {
        $('#'+modal).openModal();
        setTimeout(function(){$(".lean-overlay").unbind('click'); },1000);
    }

    function toast (message)
    {
        Materialize.toast(message, 5000, 'cyan darken-3')
    };

    function showConfirmacion()
    {
        $(".confirmacion").css("visibility", "visible");
        $(".deleteButton").addClass("disabled");

        setTimeout(function()
        {
            $(".confirmacion").css("visibility", "hidden");
            $(".deleteButton").removeClass("disabled");
        },2000);
    }

    function showLoginData(u, p)
    {
        $('#loginData').css("display", "none");
        $('#user').html(u);
        $('#pass').html(p)
    }

    $('.modal-trigger').click(function(event) {setTimeout(function(){$(".lean-overlay").unbind('click'); },500);    });

    function resizeCheckModal()
    {

        if (window.innerWidth > 1300) 
        {
            $('div#checkModal.animated').css({left: '40%',right: '40%'});
            $('header>input[type=text]').css('width', '45%');
        }
        else if (window.innerWidth > 1000) 
        {
            $('div#checkModal.animated').css({left: '35%',right: '35%'});
            $('header>input[type=text]').css('width', '50%');
        }
        else if (window.innerWidth > 600) 
        {
            $('div#checkModal.animated').css({left: '25%',right: '25%'});
            $('header>input[type=text]').css('width', '50%');
        }
        else if (window.innerWidth > 400) 
        {
            $('div#checkModal.animated').css({left: '15%',right: '15%'});
            $('header>input[type=text]').css('width', '50%');
        }
        else 
        {
            $('div#checkModal.animated').css({left: '10%',right: '10%'});
            $('header>input[type=text]').css('width', '50%');
        }           
    }

    // $(window).resize(function(event) 
    // {
    //     if ( $(window).width() > 992) 
    //     {      
    //         $('#navMenu').css('transform', 'translateX(0)');
    //               $('.brand-logo').css('padding-left', '300px');
    //     $('.container').css('padding-left', '300px');
    //     } 
    //     else if ( $(window).width() < 992) 
    //     {
          
    //          $('#navMenu').css('transform', 'translateX(-100%)');
    //         $('.brand-logo').css('padding-left', '0');
    //         $('.container').css('padding-left', '0');      
    //     }

    // });

    
    function searchActive()
    {
        $('#searchIcon').css('display', 'none');
        $('#closeIcon').css('display', 'block');
        $('header>input').css('display', 'block');
        $('header>input').addClass('flipInY');
        $('header>input').removeClass('flipInY');
        $('header>input').focus();
    }



    function searchActiveContent()
    {
        $('.page-header>#searchIcon').css('display', 'none');
        $('.page-header>#closeIcon').css('display', 'block');
        $('.page-header>#backIcon').css('display', 'block');
        $('.page-header>span').css('display', 'none');
        $('.page-header>input').css('display', 'block');
        $('.page-header>input').focus();
    }
    function searchDesactiveContent()
    {
        $('.page-header>#searchIcon').css('display', 'block');
        $('.page-header>#closeIcon').css('display', 'none');
        $('.page-header>#backIcon').css('display', 'none');
        $('.page-header>span').css('display', 'block');
        $('.page-header>input').css('display', 'none');
    }    


    $('#navMenu>li>a').click(function(event) 
    {
        setTimeout(function()
        {
            $('header>input').focus(function(event) 
            {
                $('header').css('box-shadow','0px 1px 5px black')
                $('header').css('transition','box-shadow 0.2s ease-in-out');
            });
            $('header>input').focusout(function(event) 
            {
                $('header').css('box-shadow','0 0 0 ')
            });        
        }, 1000);

    });

   

    function openGPSModalNew(){$('#new').css('display', 'block');}
    function openGPSModalEdit(){$('#edit').css('display', 'block');}
    function openGPSModalEdit2(){$('#processEdit').css('display', 'block');}
    function openGPSModalNew2(){$('#processNew').css('display', 'block');}
    function openCheckSucursal(){resizeCheckModal();$('#checkSucursal').css('display', 'block');$('#checkModal').removeClass('bounceIn');$('#checkModal').addClass('bounceIn')}
    function openCheckPresentaciones(){resizeCheckModal();$('#checkPresentaciones').css('display', 'block');$('#checkPresentaciones').removeClass('bounceIn');$('#checkPresentaciones').addClass('bounceIn')}


    function closeGPSModal()
    { 
        $('.xmodal-wrapper').css('display', 'none');
        $('#searchIcon').css('display', 'block');
        $('#closeIcon').css('display', 'none');
        $('header>input').css('display', 'none');
    }
    function openXmodal(modal)
    {
        resizeCheckModal();
        $('#'+modal).css('display', 'block');
        $('#'+modal).removeClass('bounceIn');
        $('#'+modal).addClass('bounceIn')
    }
    function gotoArticle (article)
    {
        $('article#presentaciones').css('display', 'none');
        $('article#ingredientes').css('display', 'none');
        $('article#precio').css('display', 'none');

        $('article#'+article).css('display', 'block');

        article == 'precio' ? $('#txtprecio').focus() : undefined;
    }

    asyncForEach = async (array, callback) => {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    getIndex = function (json, clave, valor){
        var status = 0;
        for (var i = 0; i < json.length; i++) {
            if (json[i][clave] == valor)
                return i;
            else status ++;
        }
        if (status == json.length) return -1;
    }
    