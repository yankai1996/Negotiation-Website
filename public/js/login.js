$(function(){
	
	console.log("Welcome! Please log in.");

	var $user = $("#user")
	  , $admin = $("#admin")
	  , $arrow = $(".arrow")
	  , $loginAs = $("[name='loginAs']")
	  , $username = $("[name='username']")
	  , $password = $("[name='password']")
	  ;

	$password.hide();
	$password.removeAttr('required');
	$password.addClass('no-placeholder');


	$admin.click(() => {
		$loginAs.val('instructor');
		$username.val('');
		$password.val('');
		$admin.removeClass('gray');
		$user.addClass('gray');
		$arrow.addClass('right');
		$password.attr('required', true);
		$password.removeClass('no-placeholder');
		$password.slideDown();
	});

	$user.click(() => {
		$loginAs.val('participant');
		$username.val('');
		$password.val('');
		$user.removeClass('gray');
		$admin.addClass('gray');
		$arrow.removeClass('right');
		$password.removeAttr('required');
		$password.addClass('no-placeholder');
		$password.slideUp();
	});

});