// JavaScript Document
var _g = globals = {};
var app = app || {};  //Évite d'overwritter des plugins s'il y en a

app = function(pCulture, pRoot) {
  var self = this;
  self.path = { // Path permettant d'accèder aux divers fichiers externes utilisés.
    root:       pRoot,
    data:       pRoot + "public/data/",
    settings:   pRoot + "public/data/settings/",
    librairies: pRoot + "app/libraries/",
    images:     pRoot + 'public/images/',
    templates:  pRoot + 'public/templates/',
    temps:      pRoot + 'temps/'
  }

  self.form = {
    step: 0,
    culture: pCulture,
    browser: detectBrowser()[0],
    settings: {}, // Contiens tous les settings possibles (default, 480x325, etc)
    current: {
      id: 0,
      offersNbr: 0
    }
  }

  self.defaultAd = { // Annonce par défaut
    category: "deals",
    format: {
      text: "480x325",
      w: 480,
      h: 325
    },
    offers: [],
    settings: {},
    gallery: false
  }
  $.extend(self.ad = {}, self.defaultAd);

  $.when( //Télécharge tous les settings externes nécessaires
    $.get( self.path.templates + 'form-offer.mustache', function(r) { self.ad.template = r; } ),
    $.getJSON( self.path.data + self.form.culture + "/text.json", function(r) { self.text = r; } ),
    $.getJSON( self.path.settings + "default.json", function(r) { self.form.settings.default = r; } ),
    $.getJSON( self.path.settings + "230x152.json", function(r) { self.form.settings['230x152'] = r; } ),
    $.getJSON( self.path.settings + "230x325.json", function(r) { self.form.settings['230x325'] = r; } ),
    $.getJSON( self.path.settings + "480x152.json", function(r) { self.form.settings['480x152'] = r; } ),
    $.getJSON( self.path.settings + "480x325.json", function(r) { self.form.settings['480x325'] = r; } )
  ).then(function() { // Ensuite initialise la page
    //--- functions -----------------
    self.map_(); 
    self.init_();
    self.bindEvents_();
  });
};

//=== MAP START =====================================================
app.prototype.map_ = function() {
  var self = this;
  self.dom = {
    b: $('body'),
    header: $('.main-header'),
    import: $('.js-import-ad'),
    adDropZone: $('.ad-drop-zone'),
    adDropZoneClose: $('.ad-drop-zone__close'),
    f: $('.js-form'),
    steps: $('.steps'),
    step0: $('.step.no0'),
    step1: $('.step.no1'),
    step2: $('.step.no2'),
    step3: $('.step.no3'),
    goStep0: $('.js-goStep0'),
    goStep1: $('.js-goStep1'),
    goStep2: $('.js-goStep2'),
    goStep3: $('.js-goStep3'),
    offersNbr: $('[name="offersNbr"]'),
    addOfferBtn: $('.js-add-offer'),
    addOfferMsg: $('.add-offer-msg'),
    offersList: $('.offers-list'),
    render: $('iframe.render'),
    zipable: $('iframe.zipable'),
    downloadBtn: $('.js-download'),
    popupConfirmation: $('.popup.confirmation'),
    cancel: $('.popup.confirmation .js-cancel'),
    confirmBtn: $('.popup.confirmation .js-confirm'),
    popupDelete: $('.popup.delete'),
    popupDeleteText: $('.popup.delete .text'),
    popupError: $('.popup.error'),
    popupErrorText: $('.popup.error .text'),
    popupErrorClose: $('.popup.error .js-cancel'),
    processing: $('.processing'),
    tip: $('.tip'),
    btn: {
      changeCancel: $('.popup.delete .js-cancel'),
      changeConfirm: $('.popup.delete .js-confirm')
    },
    field: {
      id: $('[name="id"]'),
      offersId: $('[name="offersId"]'),
      noClient: $('[name="noClient"]'),
      noAd: $('[name="noAd"]'),
      category: $('[name="category"]'),
      preLogo: $('[name="pre-logo"]'),
      logo: $('.file-input[name=logo]'),
      logoPreview: $('.field.logo .preview'),
      offersNbr: $('[name=offersNbr]'),
      date: $('[name="date"]'),
      formatRadio: $(".format input"),
      format: $('[name="format"]'),
      iConfirm: $('[name="iConfirm"]')
    }
  };
};

//=== INIT START =====================================================
app.prototype.init_ = function(pObj) {
  var self = this;

  self.ad.id = uniqueId(); // Id / nom du dossier dans temp
  self.form.adblock = window.canRunAds === undefined ? true : false;
  self.dom.field.id.val( self.ad.id );
  $.extend( self.ad.settings, self.form.settings[self.ad.format.text] );

  if(self.form.browser === "Safari") {
    $('body').addClass('isSafari');
  }

  self.initFieldsValidation_();
  self.initCustomRadios_();
  self.verticalAlign_( $('.step.no1 .content') );
  self.setAdblockTip_();
};

//=== BIND START =====================================================
app.prototype.bindEvents_ = function() {
  var self = this;

  self.dom.addOfferBtn.on('click', function(e) {
    e.preventDefault();
    self.addOffer_( {}, 500 ) // Ajoute une offre vide avec une animation de .5s
  });

  self.dom.goStep0.on('click', function() {
    self.goToStep_( 0 );
  });

  self.dom.goStep1.on('click', function() {
    self.goToStep_( 1 );
  });

  self.dom.goStep2.on('click', function() {
    self.goToStep2_();
  });

  self.dom.goStep3.on('click', function() {
    self.goToStep3_();
  });

  self.dom.step1.on('click', '.radio', function() {
    self.updateFormat_( $(this).prev().val() );
  });

  self.dom.field.category.on('change', function() {
    self.updateCategory_( $(this).val() );
  });

  self.dom.steps.on('focus', '[name$="_freetext"]', function() {
    $(this).prev('label').children('input').prop('checked', true);
  });

  self.dom.steps.on('change', '.file-input', function() {
     self.updateInputFilePreview_( $(this) );
  });

  self.dom.steps.on('click', '.file-input', function() {
    resetFormElement( $(this) );
  });

  self.dom.steps.on('change', '.multi-files input', function() {
    self.addMultiFiles_( $(this) );
  });

  self.dom.steps.on('click', '.js-erease', function() {
    self.deleteMultiFiles_($(this).closest('li').data('key'), $(this).data('id'));
  });

  self.dom.steps.on('change', '.video input', function() {
    self.updateVideo_( $(this) );
  });

  self.dom.steps.on('click', '.js-erease-video', function() {
    self.deleteVideo_( $(this).closest('.row').find('input') );
  });

  self.dom.steps.on('click', '.delete-offer a', function(e) {
    e.preventDefault();
    self.deleteOffer_( $(this).closest('fieldset').data('id') );
  });

  self.dom.downloadBtn.on('click', function(e) {
    e.preventDefault();
    self.dom.popupConfirmation.addClass('active');
  });

  self.dom.cancel.on('click', function(e) {
    e.preventDefault();
    self.dom.popupConfirmation.removeClass('active');
  });

  self.dom.field.iConfirm.on('change', function(e) {
    self.dom.downloadBtn.toggleClass('disabled');
  });

  self.dom.confirmBtn.on('click', function(e) {
    e.preventDefault();
    self.generateAd();
  });

  self.dom.btn.changeCancel.on('click', function(e) {
    e.preventDefault();
    self.cancelChange_();
  });

   self.dom.btn.changeConfirm.on('click', function(e) {
    e.preventDefault();
    self.confirmChange_();
  }); 

  self.dom.steps.on('keyup', '[maxlength]', function(e) {
    self.updateFieldLength_( $(this) );
  });

  self.dom.popupErrorClose.on('click', function() {
    self.dom.popupError.removeClass('active');
  });

  self.dom.import.on('change', function() {
    self.getUploadedAd_( $(this) );
  });

  $(document).on('dragover', function(e) {
    self.showAdDropZone_(e);
  });

  $(document).on('dragleave', function(e) {
    self.closeAdDropZone_();
  });

  self.dom.adDropZoneClose.on('click', function() {
    self.closeAdDropZone_();
  });

  self.dom.tip.on('click', function() {
    self.hideTip_();
  });

  self.dom.tip.on('click', 'a', function(e) {
    e.stopImmediatePropagation();
  });
};


/*=== Init Custom Radio ==========================================*/
app.prototype.initCustomRadios_ = function() {
  var self = this;

  // replace checkboxes with images
  self.dom.field.formatRadio.each(function() {
      var radio = $(this);
      var value = radio.val();
      if(radio.attr( 'checked' )) { // radio button is checked onload
          radio.hide();
          radio.after( $("<img src='" + self.path.images + "formats/" + value + ".svg' class='radio valid' />") );
      } else { // radio button is not checked
          radio.hide();
          radio.after( $("<img src='" + self.path.images + "formats/" + value + ".svg' class='radio'  />") );
      }
  });
};

/*=== Init Validator ==========================================*/
app.prototype.initFieldsValidation_ = function() {
  var self = this;

  /* jQuery Validate */
  jQuery.extend(jQuery.validator.messages, {
    required: ' <span class="msg">(' + self.text['requiredField'] + ')</span>',
    maxlength: jQuery.validator.format(' <span class="msg">(' + self.text['maxlength'] + ')</span>')
  });

  $.validator.addMethod("time", function(value, element) {  
    return this.optional(element) || /^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])?$/i.test(value);  
  }, "Please enter a valid time.");

  self.form.validator = self.dom.f.validate({
    debug: true,
    errorPlacement: function(error, element) {
      error.appendTo( element.closest('.field').find('.lbl') );
    },
    highlight: function(element, errorClass, validClass) {
      $(element).closest('.field').addClass('error').removeClass('valid');
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).closest('.field').addClass('valid').removeClass('error');
    },
    rules: {
      noClient: {
        required: true
      },
      noAd: {
        required: false,
        minlength: 7,
        maxlength: 7
      },
      logo: {
        required: true
      }
    },
    messages: {
      noAd: {
        minlength: ' <span class="msg">(' + self.text['mustContain7digits'] + ')</span>',
        maxlength: ' <span class="msg">(' + self.text['mustContain7digits'] + ')</span>'
      }
    }  
  });

  /* jQuery Mask */
  self.dom.field.noAd.mask('0000000'); // 7 char
};

/*=== Get Ad Uploaded ==========================================*/
app.prototype.getUploadedAd_ = function(pInput) {
  var self = this;
  var form = pInput.closest('.import');

  self.dom.adDropZone.removeClass('active');

  if(!inputContainImg( pInput )) { // Si un zip est uploadé et non une image
    var formData = new FormData(form[0]);

    $.ajax({
        url: self.path.librairies + "uploadZip.php",
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    }).done(function( folderId ) {
      self.initFormWithUploadAdSource_( folderId );
    }).fail(function( error ) {
      var msg = self.text.errors.treatmentPhp;
      msg += "<p>"+ jQuery.parseJSON( error ) + "</p>";
      self.setErrorPopup_( msg );
    });

  } else { // Un fichier de type image à été téléchargé plutôt qu'un .zip
    self.setErrorPopup_(self.text.errors.zipOnly);
  }
};

/*=== Init Form with uploaded ad's _source.json file =======*/
app.prototype.initFormWithUploadAdSource_ = function(pFolder) {
  var self = this;

  $.getJSON(self.path.temps + pFolder + "/assets/_source.json", function(data) { // Télécharge la source de la pub à éditer
    self.ad.id = pFolder;
    data.folder = self.path.temps + self.ad.id;
    data.meta.id = self.ad.id;
    self.setStep1_( data );
    $.extend( self.ad, self.getStep1_() );
    self.convertSettings_();
    console.log(self.ad);
    self.convertOffersFormSourceToObj_( data.offers.list );
    self.setStep2_();
    self.setStep3_();
  }).error(function() { 
    self.setErrorPopup_( self.text.errors.sourceMissing );
  })
};

/*=== Set Step 1 ==========================================*/
app.prototype.setStep1_ = function(pData) {
  var self = this;

  self.dom.field.id.val( pData.meta.id );
  self.dom.field.noClient.val( pData.meta.noClient );
  self.dom.field.noAd.val( pData.meta.noAd );
  self.dom.field.category.val( pData.meta.category );
  self.updateFormat_( pData.meta.format );
  /*--- Logo ---*/
  self.dom.field.preLogo.val( pData.logo.name );
  self.dom.field.logo.removeClass( 'js-validate' ).closest( '.half' ).addClass( 'valid' );
  $('.field.logo').addClass( 'valid' );
  self.dom.field.logoPreview.addClass( 'active' ).css( 'background-image', 'url("' + pData.folder + '/assets/' + pData.logo.name + '")' );
  self.dom.field.offersNbr.val( pData.offers.nbr );
};

/*=== Get Step 1 ==========================================*/
app.prototype.getStep1_ = function() {
  var self = this;
  var format = self.dom.field.format.filter(":checked").val();
  var ad = {
    id: self.dom.field.id.val(),
    client: self.dom.field.noClient.val(),
    noAd: self.dom.field.noAd.val(),
    category: self.dom.field.category.val(),
    format: self.convertFormat_( format ),
    settings: self.convertSettings_( self.form.settings.default, self.form.settings[format] )
  };
  return ad;
};

/*=== Convert Offers ==========================================*/
app.prototype.convertOffersFormSourceToObj_ = function(pOffers) {
  var self = this;
  var offers = [];

  for(var x=0; x<pOffers.length; x++) {
    var offer = pOffers[x];

    var obj = {
      id: x,
      strapline: offer.strapline,
      title: offer.title,
      date: offer.date,
      time: offer.time,
      mention1: {
        no0: offer.mentions[0] === "",
        no1: offer.mentions[0] === "À partir de",
        no2: offer.mentions[0] === "Par personne",
        no3: offer.mentions[0] === "Vol inclus",
        no4: offer.mentions[0] === "Taxes incluses"
      },
      mention2: {
        no0: offer.mentions[1] === "" || offer.mentions[1] == undefined,
        no1: offer.mentions[1] === "À partir de",
        no2: offer.mentions[1] === "Par personne",
        no3: offer.mentions[1] === "Vol inclus",
        no4: offer.mentions[1] === "Taxes incluses"
      },
      rating: offer.rating,
      link: offer.link,
      description: offer.description.replace(/<br\s*[\/]?>/gi, "")
    }

    if(offer.place) {
      obj.place = offer.place;
    }
    if(offer.price) {
      obj.price = offer.price.replace(" ", "");
    }
    if(offer.legal) {
      obj.legal = offer.legal.text.replace(/<br\s*[\/]?>/gi, "");
    }
    if(!obj.mention1.no1 && !obj.mention1.no2 && !obj.mention1.no3 && !obj.mention1.no4) {
      obj.mention1.no5 = true;
      obj.mention1.freetext = offer.mentions[0];
    }
    if(offer.mentions[1] && !obj.mention2.no1 && !obj.mention2.no2 && !obj.mention2.no3 && !obj.mention2.no4) {
      obj.mention2.no5 = true;
      obj.mention2.freetext = offer.mentions[1];
    }
    obj.pictures = [];
    for(var y=0; y<offer.gallery.pictures.length; y++) {
      obj.pictures.push(offer.gallery.pictures[y].name);
    }
    if(offer.video) {
      obj.video = offer.video.name;
    }

    offers.push(obj);
  }

  self.ad.offers = offers;
};

/*=== Convert Format ==========================================*/
app.prototype.convertFormat_ = function(pFormat) {
  var self = this;
  var format = {
    text: pFormat,
    w: parseInt(pFormat.split('x')[0]),
    h: parseInt(pFormat.split('x')[1])
  }
  return format;
};

/*=== Convert Settings ==========================================*/
app.prototype.convertSettings_ = function(pDefault, pFormat) {
  var self = this;
  var settings = self.ad.settings;

  if(pDefault && pFormat) {
    settings = $.extend({}, pDefault, pFormat);
  }
  
  if(self.ad.category === "conferences") {
    settings.price = false;
    settings.date = true;
  }
  return settings;
};

/*=== Set Step 2 ==========================================*/
app.prototype.setStep2_ = function() {
  var self = this;

  for(x=0; x<self.ad.offers.length; x++) {
    var obj = {};
    jQuery.extend( obj, self.ad );
    obj.filled = self.ad.offers[x];
    self.addOffer_( obj );
  }

  self.goToStep_( 2 );
};

/*=== Add Offer ============================================*/
app.prototype.addOffer_ = function(pOffer, pSpeed) {
  var self = this;
  if(self.form.current.offersNbr < self.ad.settings.maxOffers && !self.ad.gallery) { // Si nous avons le droit d'ajouter une offre
    var prefilled = pOffer ? true : false;
    pOffer = pOffer ? pOffer : {}; // Si aucune offre n'est passée, en créer une vide
    pOffer.id = self.newOfferId_();
    pOffer.settings = self.ad.settings; // Définir les settings des champs de l'offre
    pOffer.t = self.text; // Définir les textes selon la langue (ex: Surtitre / Strapline)
    pSpeed = pSpeed ? parseInt( pSpeed ) : 0; // Si aucune vitesse n'est passé, donner 0 comme valeur

    console.log(pOffer);

    var html = Mustache.render( self.ad.template, pOffer );
    self.dom.offersList.append( html );
    
    self.form.current.offersNbr++;
    if(!prefilled) {
      self.ad.offers.push( {id: pOffer.id} );
    }
    self.initOffer_( pOffer );

    setTimeout(function() { // Délais pour animation
      var offer = self.dom.offersList.find('fieldset[data-id="'+ pOffer.id +'"]');
      offer.addClass('created');
      self.updateOfferFieldsLength_(offer);
    }, pSpeed)
  }
};

/*=== Go to Step 2 ==========================================*/
app.prototype.goToStep2_ = function() {
  var self = this;

  if(self.form.step === 0) { // Step 0
    self.setTip_({
      msg: self.text.warning.generalDataBeforeOffers,
      class: "generalDataBeforeOffers"
    });
    self.goToStep_( 1 );
  } else if(self.form.step === 1) { // Step 1
    if(self.validateStep_()) {  // Si le Step 1 est valid
      if(self.ad.offers.length === 0) {
        $.extend( self.ad, self.getStep1_() );
        self.addOffer_();
      }
      self.goToStep_( 2 );
    }
  } else if(self.form.step === 3) { // Step 3
    self.dom.field.iConfirm.attr('checked', false);
    self.dom.downloadBtn.addClass('disabled');
    self.goToStep_( 2 );
  }
};

/*=== Go to Step 3 ==========================================*/
app.prototype.goToStep3_ = function() {
  var self = this;

  if(self.form.step === 0) { // Step 0
    self.setTip_({
      msg: self.text.warning.createBeforePreview,
      class: "createBeforePreview"
    });
  } else if(self.form.step === 1) { // Step 1
    if(self.validateStep_()) {
      if(self.ad.offers.length > 0) {
        if(self.validateStep_( 2 )) {
          self.setStep3_(); 
        }
      } else {
        $.extend( self.ad, self.getStep1_() );
        self.addOffer_();

        self.setTip_({
          msg: self.text.warning.offerBeforePreview,
          class: "offerBeforePreview"
        });

        self.goToStep_( 2 );
      }
    }
  } else if(self.form.step === 2) { // Step 2
    if(self.validateStep_()) { 
      self.setStep3_(); 
    };
  }
};

/*=== Génère un id unique par offre =======================================*/
app.prototype.newOfferId_ = function() {
  var self = this;
  var id = self.form.current.id;
  self.form.current.id++;
  return id;
}

/*=== Init Offer ===========================================*/
app.prototype.initOffer_ = function(pOffer) {
  var self = this;

  self.initMultiFiles_( $('input[name="'+ pOffer.id +'_picture[]"]') );
  self.updateMultifiles_();
  self.updateAddOfferBtn_();
  self.updateOffersList_();
  self.updateVideo_( $('input[name="'+ pOffer.id +'_picture[]"]') );

  self.setOfferValidation_(self.ad, pOffer);
  self.updateOffer_(pOffer.id);
};

/*=== Update Offers Fields Length ==========================================*/
app.prototype.updateOfferFieldsLength_ = function(pOffer) {
  var self = this;
  var fields = pOffer.find('.countMaxCharacter').prev();
  for(x=0; x<fields.length; x++) {
    self.updateFieldLength_( $( fields[x] ) );
  }
};

/*=== Update Field Length ==========================================*/
app.prototype.updateFieldLength_ = function(pField) {
  var self = this;

  if( pField.next().hasClass( 'countMaxCharacter' ) ) { // Si il y a un compteur à la suite d'un champs
    var nbr = parseInt( pField.attr( 'maxlength' ) ) - pField.val().length; // Char restant
    pField.next().text( nbr ); // Mettre à jours le compteur
  }
};

/*=== Step 2 validation ============================================*/
app.prototype.setOfferValidation_ = function(pAd, pOffer) {
  var self = this;

  // Titre
  $("textarea[name='"+ pOffer.id +"_title']").rules('add', {
    required: true
  });
  // Prix
  if(pAd.settings.price == true) {
    self.dom.f.find("input[name='"+ pOffer.id +"_price']").rules('add', {
      required: true
    });
    $("input[name='"+ pOffer.id +"_price']").mask('99999');
  }
  // Date
  if(pAd.settings.date == true) {
    self.dom.f.find("input[name='"+ pOffer.id +"_date']").rules('add', {
      required: true,
      date: true,
      messages: {
        date: ' <span class="msg">(' + self.text['enterValidDate'] + ')'
      }
    });
    $("input[name='"+ pOffer.id +"_date']").mask('0000-09-09');
    // Heure
    self.dom.f.find("input[name='"+ pOffer.id +"_time']").rules('add', {
      required: true,
      time: true,
      messages: {
        time: ' <span class="msg">(' + self.text['enterValidHour'] + ')'
      }
    });
    $("input[name='"+ pOffer.id +"_time']").mask('09:00');
  }

  $('.' + pOffer.id + '_rateit').rateit({ max: 5, step: 1, backingfld: '#' + pOffer.id + '_rateit_val' });

  // Lien web
  $("input[name='"+ pOffer.id +"_link']").rules('add', {
    required: true,
    url: true,
    messages: {
      url: ' <span class="msg">(' + self.text['enterValidURL'] + ')'
    }
  });

  // Description
  if(pAd.settings.description == true) {
    $("textarea[name='"+ pOffer.id +"_description']").rules('add', {
      required: true
    });
  }
};

/*=== Update Settings ============================================*/
app.prototype.updateSettings_ = function() {
  var self = this;
  $.extend( self.ad.settings, self.form.settings[self.ad.format.text] );
  if(self.ad.category === "conferences") {
    $.extend( self.ad.settings, {date: true, price: false,} );
  }
};

/*=== Delete Offer ===========================================*/
app.prototype.deleteOffer_ = function(pId) {
  var self = this;
  $('fieldset[data-id="' + pId + '"]').remove();
  self.ad.offers = self.ad.offers.filter(function( index ) {
    return index.id !== pId;
  })

  self.form.current.offersNbr--;
  self.updateAddOfferBtn_();
  self.updateOffersList_();
  self.updateOffer_(pId);
};

/*=== Update Offer ===========================================*/
app.prototype.updateOffer_ = function(pId) {
  var self = this;
  var currVal = self.dom.field.offersId.val();
  var arrIds = currVal === '' ? [] : currVal.split(',');
  var strIds = "";
  if (pId != null) {
    var index = arrIds.indexOf(pId.toString());
    var multifiles = $('.multi-files .btn');
    if(index === -1) {
      arrIds.push(pId);
    } else {
      arrIds.splice(index, 1);
    }
  } else {
    arrIds = [];
  }
  strIds = arrIds.toString();
  self.dom.field.offersId.val(strIds);
};

/*=== Update Offers List ===================================*/
app.prototype.updateOffersList_ = function() {
  var self = this;

  if(self.form.current.offersNbr > 1) {
    if(self.dom.b.width() > 1020) {
      self.dom.offersList.addClass('extend');
    }
  } else {
    self.dom.offersList.removeClass('extend');
  }
};

/*=== Set Step 3 ==========================================*/
app.prototype.setStep3_ = function() {
  var self = this;
  var data = new FormData(self.dom.f[0]);

  self.dom.processing.addClass('active');

  $.ajax({
    type: "POST",
    url: self.path.root + 'ad.php',
    data: data,
    cache: false,
    contentType: false,
    processData: false
  }).done(function( html ) {
    self.writeGeneratedAdInIframePreview_( html );
    self.writeGeneratedAdInIframeForDownload_( html );
    setTimeout(function() {
      self.setPreviewTipAccordingToBrowser_();
    }, 1000);
    self.goToStep_( 3 );
  }).fail(function( error ) {
    var msg = self.text.errors.renderAd;
    if(self.form.adblock) {
      msg += "<p>" + self.text.warning.adblockRender + "</p>";
    }
    msg += "<p>" + error.responseText + "</p>";
    self.setErrorPopup_( msg );
    console.log(error);
  }).always(function() {
    self.dom.processing.removeClass('active');
  })
};

/*=== Generate Preview ==========================================*/
app.prototype.writeGeneratedAdInIframePreview_ = function( pAd ) {
  var self = this;
  var preview = self.dom.render[0].contentDocument;

  self.dom.render.css({
    'width':  self.ad.format.w + 'px', 
    'height': self.ad.format.h + 'px'
  })

  preview.open();
  preview.write( pAd );
  preview.close();
};

/*=== Generate iFrame for download ==============================*/
app.prototype.writeGeneratedAdInIframeForDownload_ = function( pAd ) {
  /* Le 2e iFrame est important.
     Au moment de ziper l'annonce, on ne veut pas qu'elle aille été modifié par l'usager.
     Par exemple: l'annonce pourrait-être flippé ou le légal sorti.
  */
  var self = this;
  var zipable = self.dom.zipable[0].contentDocument;
  zipable.open();
  zipable.write( pAd );
  zipable.close();
};

app.prototype.setPreviewTipAccordingToBrowser_ = function() {
  var self = this;
  if(self.form.browser !== "Chrome" && self.form.browser !== "Safari") {
    var msg = self.text.warning.browserPreview;
    msg = msg.replace("{{browser}}", self.form.browser);
    self.setTip_({
      msg: msg,
      class: "browserRender"
    });
  }
};

app.prototype.setAdblockTip_ = function() {
  var self = this;
  if(self.form.adblock) {
    self.setTip_({
      msg: self.text.warning.adblock,
      class: "adblock"
    });
  }
};

app.prototype.setTip_ = function(pTip) {
  var self = this;
  self.dom.tip.html( pTip.msg ).addClass( pTip.class + ' active' );
};

app.prototype.hideTip_ = function() {
  var self = this;
  self.dom.tip.removeClass('active');
  setTimeout(function() {
    self.dom.tip.delay(1000).attr('class', 'tip').html("");
  }, 1000)
};

/*=== Update Video ==========================================*/
app.prototype.updateVideo_ = function(pInput) {
  var self = this;
  var row = pInput.closest('.row');
  var files = row.find('.files-list');
  var hidden = row.find('input[type="hidden"]');

  pInput.blur();
  if(pInput.val() === '') {
    files.addClass('hide');
    if(hidden && hidden.val() !== '') {
      files.removeClass('hide');
    }
  } else {
    files.removeClass('hide');
    if(hidden) {
      hidden.val("");
    }
  }
};

/*=== Delete Video ==========================================*/
app.prototype.deleteVideo_ = function(pInput) {
  var self = this;
  var row = pInput.closest('.row');
  var files = row.find('.files-list');
  var hidden = row.find('input[type="hidden"]');

  resetFormElement(pInput);
  hidden.val("");
  files.addClass('hide');
  row.find('.field').removeClass('valid');
  pInput.blur();
};

/*=== Update Category ===========================================*/
app.prototype.updateCategory_ = function(pCategory, pConfirm) {
  var self = this;
  var askConfirmation = false;

  if( self.ad.category === "conferences" || pCategory === "conferences" ) {
    if( self.ad.offers.length > 0 ) {
      askConfirmation = true;
    } 
  }
  if( pConfirm ) {
    askConfirmation = false;
  }
  if( askConfirmation ) {
    var msg = self.text['warningChange'] + '<strong>' + self.text['category'] + '</strong>' + self.text['lossOffersInfos'];
    self.askConfirmation_( self.text['category'], pCategory, self.ad.category, msg );
  } else {
    self.ad.category = pCategory;
    self.dom.field.category.val( pCategory );
    self.updateSettings_();
  }
};

/*=== Update Format ============================================*/
app.prototype.updateFormat_ = function(pFormat, pConfirm) {
  var self = this;
  var msg = self.text['warningChange'] + '<strong>' + self.text['format'] + '</strong>' + self.text['lossOffersInfos'];

  if( pConfirm || self.ad.offers.length < 1) {
    var radioSelected = self.dom.field.format.filter(':checked');
    var radioNew = self.dom.field.format.filter('[value="' + pFormat + '"]');

    radioSelected.prop('checked', 'false').next().removeClass('valid');
    radioNew.prop('checked', 'true').next().addClass('valid');

    self.ad.format = self.convertFormat_( pFormat );
  } else {
    self.askConfirmation_(self.text['format'], pFormat, self.ad.format.text, msg);
  }
};

/*=== Ask Confirmation ===========================================*/
app.prototype.askConfirmation_ = function(pType, pValue, pCurrentValue, msg) {
  var self = this;
  self.dom.popupDeleteText.html(msg);
  self.dom.popupDelete.addClass( 'active' );
  self.dom.btn.changeConfirm.data({
    'type': pType, 
    'value': pValue 
  });
  self.dom.btn.changeCancel.data({
    'type': pType, 
    'value': pCurrentValue
  });
};

/*=== Confirm Change ===========================================*/
app.prototype.confirmChange_ = function() {
  var self = this;
  var type = self.dom.btn.changeConfirm.data( 'type' );
  var value = self.dom.btn.changeConfirm.data( 'value' );
  self.dom.popupDelete.removeClass( 'active' );
  if(type === self.text['category']) {
    self.updateCategory_( value, true );
  } else if(type === self.text['format']) {
    self.updateFormat_( value, true );
  }
  self.resetOffers_();
};

/*=== Cancel Change ===========================================*/
app.prototype.cancelChange_ = function() {
  var self = this;
  var type = self.dom.btn.changeCancel.data( 'type' );
  var value = self.dom.btn.changeCancel.data( 'value' );
  self.dom.popupDelete.removeClass( 'active' );
  if(type === self.text['category']) {
    self.updateCategory_( value, true );
  } else if(type === self.text['format']) {
    self.updateFormat_( value, true );
  }
};

/*=== Go to Step ===========================================*/
app.prototype.goToStep_ = function(pStep) {
  var self = this;
  self.form.step = pStep;
  self.dom.b.removeClass('no0 no1 no2 no3').addClass('no' + self.form.step);
};

/*=== Validate ===========================================*/
app.prototype.validateStep_ = function(pStep) {
  var self = this;
  var step = pStep ? $('.step.no' + pStep) : $('.step.no' + self.form.step);
  var valid = true;

  $('.js-validate', step).each(function(i, v) {
    valid = self.form.validator.element(v) && valid;
  });

  return valid;
};

/*=== Reset Offers ===========================================*/
app.prototype.resetOffers_ = function() {
  var self = this;
  for(var x=0; x<self.ad.offers.length; x++) {
    self.deleteOffer_( self.ad.offers[x].id );
  }
  self.ad.gallery = false;
};

/*=== Update Add Offer Btn ============================================*/
app.prototype.updateAddOfferBtn_ = function() {
  var self = this;

  if( self.form.current.offersNbr === self.ad.settings.maxOffers ) {
    self.dom.addOfferBtn.addClass( 'disabled' );
    self.dom.addOfferMsg.html( '(' + self.text['offersMaxReached'] + ')' );
  } else if( self.ad.gallery ) {
    self.dom.addOfferBtn.addClass('disabled');
    self.dom.addOfferMsg.html( '(' + self.text['cantAddOfferIfMoreThan1picture'] + ')' );
  } else {
    self.dom.addOfferBtn.removeClass( 'disabled' );
    self.dom.addOfferMsg.html( '' );
  }
};

/*=== Init Multi Files ===============================================*/
app.prototype.initMultiFiles_ = function(pInput) {
  var self = this;
  var field = pInput.closest('.field');
  pInput.closest('.field').wrap('<div class="multi-files"></div>');
  var ol = $('<ol class="files-list"></ol>');
  var preImgs = field.find('input[type="hidden"]');

  if(preImgs.val() && preImgs.val() !== "") {
    preImgs = preImgs.val().split(",");
    
    var btn = pInput.closest('.btn');
    var txt = btn.children('.text');
    for(var x=0; x<preImgs.length; x++) {
      ol.append('<li><span class="preview" style="background-image: url(\'' + self.path.root + 'temps/' + self.ad.id +'/assets/'+ preImgs[x] +'\')"></span><a href="#" class="js-erease" data-id="'+ preImgs[x] +'"></a></li>');
    }
    var max = parseInt(btn.data('max'));
    if(ol.children().length < max) {
        txt.html(self.text['uploadOtherImages']);
        self.ad.gallery = ol.children().length > 1 ? true : false;
        self.updateAddOfferBtn_();
        self.updateMultifiles_();
    }
  }
  pInput.closest('.multi-files').append(ol);
};

/*=== Delete Multi Files ===========================================*/
app.prototype.deleteMultiFiles_ = function(pKey, pId) {
  var self = this;
  var li;
  var input;
  if(pId) {
    input = $("input[value*='" + pId + "']");
    var v = input.val();
    if(v.indexOf(pId + ',') !== -1) {
      v = v.replace(pId + ',', "");
    } else {
      v = v.replace(pId, "");
    }
    input.val(v);
    li = $("[style*='" + pId + "']").closest('li');
  } else {
    li = $('li[data-key="'+ pKey +'"]');
    input = $('input[data-key="'+ pKey +'"]');
  }
  
  var ol = li.parent();
  var field = input.closest('.field');
  var lbl = field.find('.lbl');
  var msg = lbl.find('.msg');
  var btn = field.find('.btn');
  var txt = btn.children('.text');

  if(!pId) {
    input.remove();
  }

  btn.removeClass('disabled');
  li.remove();
  
  if(ol.children().length === 0) {
    field.removeClass('valid').addClass('error');
    msg.html('(' + self.text['requiredField'] + ')');
    txt.html(self.text['uploadImage']);
  } else {
    self.ad.gallery = ol.children().length === 1 ? false : true;
    msg.html('');
    txt.html(self.text['uploadOtherImages']);
  }
  self.updateAddOfferBtn_();
};

/*=== Add Multi Files ============================================*/
app.prototype.addMultiFiles_ = function(pInput) {
  var self = this;
  self.getUploadedImageObj_(pInput, function(pImg) {
    var field = pInput.closest('.field');
    var lbl = field.find('.lbl');
    var name = pInput.attr('name');
    var btn = pInput.closest('.btn');
    var txt = btn.children('.text');
    var list = pInput.closest('.multi-files').find('.files-list');
    var key = pInput.data('key');
    var max = parseInt(btn.data('max'));
    var obj = {
      key: key,
      img: pImg
    }

    if(list.children().length < max) {
      $.get(self.path.templates + 'file-preview.mustache', function(template, textStatus, jqXhr) {
        var newKey = new Date().getTime();

        list.append(Mustache.render($(template).filter('#filePreviewTpl').html(), obj));
        txt.html(self.text['uploadOtherImages']);
        btn.append('<input type="file" accept="image/*" capture="camera" name="'+ name +'" data-key="'+ newKey +'" />');

        self.ad.gallery = list.children().length > 1 ? true : false;
        self.updateAddOfferBtn_();
        self.updateMultifiles_();
      });
    }

    pInput.addClass('hide').blur();
  });
};

/*=== Update Multi Files ============================================*/
app.prototype.updateMultifiles_ = function() {
  var self = this;
  var multifiles = $('.multi-files');
  var btns = multifiles.find('.btn');
    
  for(var x=0; x<multifiles.length; x++) {
    var msg = multifiles.eq(x).find('.msg');
    var btn = btns.eq(x);
    var txt = btn.find('.text');
    var list = multifiles.eq(x).find('.files-list');
    var max = multifiles.length > 1 ? 1 : btns.eq(x).data('max-original');

    btn.data('max', max);
    if(list.children().length == 0) {
      btn.removeClass('disabled');
      msg.html('');
      txt.html(self.text['uploadImage']);
    } else {
      if(list.children().length < btn.data('max')) {
        btn.removeClass('disabled');
        msg.html('');
        txt.html(self.text['uploadOtherImages']);
      } else {
        btn.addClass('disabled');
        msg.html(' <span class="msg">(' + self.text['maximumPicturesNumberReached'] + ')</span>');
        txt.html(self.text['uploadImage']);
      }
    }
  }
};

/*=== Generate Ad ==========================================*/
app.prototype.generateAd = function() {
  var self = this;
  var html = self.dom.zipable.contents().find("html")[0].outerHTML;

  $.ajax({
    type: "POST",
    url: self.path.librairies + "generateAd.php",
    data: {"id": self.ad.id, "html": html}
  }).done(function() {
    var zipName = self.createZipName_();
    self.zipGeneratedAd_( zipName );
  }).fail(function() {
    self.setErrorPopup_( self.text.errors.createFolders );
    console.log("error: create folder");
  }).always(function() {
    self.dom.popupConfirmation.removeClass('active');
  });
};

/*=== Create Zip Name ============================================*/
app.prototype.createZipName_ = function() {
  var self = this;
  var name = self.dom.field.noClient.val();
  name = name === "" ? "publicite" : name.toLowerCase(); // Si le nom est vide le mettre à "publicite", sinon prendre la valeur et la mettre en minuscule
  name = name.replace(/[`~!@#$%^&*()¨^_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
  name = removeDiacritics(name);
  return name;
};

/*=== Zip Generated Ad ============================================*/
app.prototype.zipGeneratedAd_ = function(zipName) {
  var self = this;
  var folder = '../../temps/' + self.ad.id;

  $.ajax({
    type: "POST",
    url: self.path.librairies + "zipFolder.php",
    data: {"folder": folder, "name": zipName}
  }).done(function() {
    self.makeBrowserDownloadGeneratedAd_( zipName );
  }).fail(function() {
    self.setErrorPopup_( self.text.errors.zipCompression );
  });
};

/*=== Make Browser Dowload Ad ============================================*/
app.prototype.makeBrowserDownloadGeneratedAd_ = function(adZipName) {
  var self = this;
  var url = self.path.root + 'temps/' + self.ad.id + '/' + adZipName + '.zip';

  $("<iframe />").css("display", "none").bind("load", function(e) {
    $(this).remove();
  }).attr("src", url).appendTo( $(document.body) );
};

/*=== Update File Preview ============================================*/
app.prototype.updateInputFilePreview_ = function(pInput) {
  var self = this;

  pInput.closest('.field').find('input[type="hidden"]').val("");
  self.getUploadedImageObj_(pInput, function(pImg) {
    var btn = pInput.closest('.btn');
    var field = btn.closest('.field');
    var lbl = field.find('.lbl');
    var preview = btn.next('.preview');
    preview.css({'background-image': 'url(' + pImg + ')'}).addClass('active');
    pInput.blur();
  });
};

/*=== Get Uploaded Image ============================================*/
app.prototype.getUploadedImageObj_ = function(pInput, callback) {
  var self = this;
  var file = pInput.prop("files")[0];
  var reader = new FileReader();

  reader.onload = function(e) {
    $("<img/>").attr("src", e.target.result).load(function() {
      var img = e.target.result;
      callback(img);
    });
  }
  reader.readAsDataURL(file); 
};

/*=== Error Popup ============================================*/
app.prototype.setErrorPopup_ = function(pMsg) {
  var self = this;
  self.dom.popupErrorText.html(pMsg);
  self.dom.popupError.addClass('active');
};

/*=== Vertical Align ============================================*/
app.prototype.verticalAlign_ = function(pElem) {
  var self = this;
  var h = pElem.children('fieldset').height();
  var browserH = self.dom.steps.height();
  var posY = ( browserH - h - 200 ) / 2;
  pElem.css('top', posY + 'px');
};

/*=== Show Drop Zone ==========================================*/
app.prototype.showAdDropZone_ = function(pEvent) {
  var self = this;

  var dt = pEvent.originalEvent.dataTransfer;
  if(dt.types != null && (dt.types.indexOf ? dt.types.indexOf('Files') != -1 : dt.types.contains('application/x-moz-file'))) {
    self.dom.adDropZone.addClass('active');
  }
};

/*=== Fermer la zone de drop publicitaire =========================*/
app.prototype.closeAdDropZone_ = function() {
  var self = this;
  self.dom.adDropZone.removeClass('active');
};