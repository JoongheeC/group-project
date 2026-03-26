$(function(){
	$('.lct_ly').hide();
	$('.family dd').hide();
	$('.brand dd').hide();
	
	//FAQ-BEST
	var faq_best = $('.faq_best');
	var faq_best_dd = $('dd', faq_best);
	var faq_best_dt = $('dt', faq_best);
	
	var nf = faq_best_dd.length;
	for(var n=0; n<=nf; n++){
		$('dd:nth('+n+')', faq_best).attr('id', 'faqb' + n);
		$('dt > a:nth('+n+')', faq_best).attr('href', '#faqb' +n);
	}
	faq_best_dd.hide();
	
	$('a', faq_best_dt).click(function(e){
		var $this = $(this);
		faq_best_dd.hide();
		faq_best_dt.removeClass('on');
		if ( !$this.parent('dt').hasClass('on') ) {
			faqwrap_dd.hide();
			faqwrap_dt.removeClass('on');
			$( $(this).attr('href') ).show();
			$(this).parent('dt').addClass('on');
		} else {
			faqwrap_dd.hide();
			faqwrap_dt.removeClass('on');
		}
		e.preventDefault();
		
	});
	
	//FAQ
	var faqwrap = $('.faqwrap');
	var faqwrap_dd = $('dd', faqwrap);
	var faqwrap_dt = $('dt', faqwrap);
	
	var nf = faqwrap_dd.length;
	for(var n=0; n<=nf; n++){
		$('dd:nth('+n+')', faqwrap).attr('id', 'faq' + n);
		$('dt > a:nth('+n+')', faqwrap).attr('href', '#faq' +n);
	}
	faqwrap_dd.hide();
	$('a', faqwrap_dt).click(function(e){
		var $this = $(this);
		e.preventDefault();
		if ( !$this.parent('dt').hasClass('on') ) {
			faqwrap_dd.hide();
			faqwrap_dt.removeClass('on');
			$( $(this).attr('href') ).show();
			$(this).parent('dt').addClass('on');
		} else {
			faqwrap_dd.hide();
			faqwrap_dt.removeClass('on');
		}
	});
	
	//컨텐츠 갯수에 따라 정렬 : 3, 4, 6
	var cstli = $('.cstwrap > ul > li').length;
	$('.cstwrap > ul > li').each(function(cstli){
		if((cstli%3) == 0){
			$('.cstwrap > ul > li:nth-child('+(cstli+3)+') > div').addClass('lst_mr10');
		}
	});
	
	var snacklist = $('.tbl_ltype5 > li').length;
	$('.tbl_ltype5 > li').each(function(snacklist){
		if((snacklist%4) == 0){
			$('.tbl_ltype5 > li:nth-child('+(snacklist+4)+')').addClass('mr0');
		}
	});
	
	var gfbrd = $('.gift_brand > li').length;
	$('.gift_brand > li').each(function(gfbrd){
		if((gfbrd%6) == 0){
			$('.gift_brand > li:nth-child('+(gfbrd+6)+')').addClass('mr0');
		}
	});

	var pordlist = $('.prod_list > li').length;
	$('.prod_list > li').each(function(pordlist){
		if((pordlist%4) == 0){
			$('.prod_list > li:nth-child('+(pordlist+4)+')').addClass('mr0');
		}
	});
});