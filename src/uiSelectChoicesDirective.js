uis.directive('uiSelectChoices',
  ['uiSelectConfig', 'RepeatParser', 'uiSelectMinErr', '$compile', '$document','$position','$window',
  function(uiSelectConfig, RepeatParser, uiSelectMinErr, $compile, $document, $position, $window) {

  return {
    restrict: 'EA',
    require: '^uiSelect',
    replace: true,
    transclude: true,
    templateUrl: function(tElement) {
      // Gets theme attribute from parent (ui-select)
      var theme = tElement.parent().attr('theme') || uiSelectConfig.theme;
      return theme + '/choices.tpl.html';
    },
    compile: function(tElement, tAttrs) {

      if (!tAttrs.repeat) throw uiSelectMinErr('repeat', "Expected 'repeat' expression.");

      return function link(scope, element, attrs, $select, transcludeFn) {

        // var repeat = RepeatParser.parse(attrs.repeat);
        var groupByExp = attrs.groupBy;

        $select.parseRepeatAttr(attrs.repeat, groupByExp); //Result ready at $select.parserResult

        $select.disableChoiceExpression = attrs.uiDisableChoice;
        $select.onHighlightCallback = attrs.onHighlight;
        $select.appendToBody = attrs.appendToBody ? attrs.appendToBody !== 'false' : $select.appendToBody;

        if(groupByExp) {
          var groups = element.querySelectorAll('.ui-select-choices-group');
          if (groups.length !== 1) throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-group but got '{0}'.", groups.length);
          groups.attr('ng-repeat', RepeatParser.getGroupNgRepeatExpression());
        }

        var choices = element.querySelectorAll('.ui-select-choices-row');
        if (choices.length !== 1) {
          throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-row but got '{0}'.", choices.length);
        }

        choices.attr('ng-repeat', RepeatParser.getNgRepeatExpression($select.parserResult.itemName, '$select.items', $select.parserResult.trackByExp, groupByExp))
            .attr('ng-if', '$select.open') //Prevent unnecessary watches when dropdown is closed
            .attr('ng-mouseenter', '$select.setActiveItem('+$select.parserResult.itemName +')')
            .attr('ng-click', '$select.select(' + $select.parserResult.itemName + ',false,$event)');

        var rowsInner = element.querySelectorAll('.ui-select-choices-row-inner');
        if (rowsInner.length !== 1) throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-row-inner but got '{0}'.", rowsInner.length);
        rowsInner.attr('uis-transclude-append', ''); //Adding uisTranscludeAppend directive to row element after choices element has ngRepeat

        $compile(element, transcludeFn)(scope); //Passing current transcludeFn to be able to append elements correctly from uisTranscludeAppend

        scope.$watch('$select.search', function(newValue) {
          if(newValue && !$select.open && $select.multiple) $select.activate(false, true);
          $select.activeIndex = $select.tagging.isActivated ? -1 : 0;
          $select.refresh(attrs.refresh);
        });

        attrs.$observe('refreshDelay', function() {
          // $eval() is needed otherwise we get a string instead of a number
          var refreshDelay = scope.$eval(attrs.refreshDelay);
          $select.refreshDelay = refreshDelay !== undefined ? refreshDelay : uiSelectConfig.refreshDelay;
        });
        
        scope.showChoices = function()
        {
        	return $select.open && $select.items.length > 0;
        };
        scope.container = element.closest('.ui-select-container');
        scope.choicesElement = element;
        if ($select.appendToBody)
        {
    		$document.find('body').append(element);
        }
        scope.showOnTop = function(position)
        {
            var viewport_bottom = $window.scrollY + $window.innerHeight;
            var max_height = scope.choicesElement.css('max-height') != 'none' ? parseInt(scope.choicesElement.css('max-height'), 10) : 200;
            return viewport_bottom < position.top + max_height;
        };
        scope.$watch('$select.open', function(newValue) {
        	if (newValue)
        	{
        		var position = $select.appendToBody ? $position.offset(scope.container) : $position.position(scope.container);
        		if ($select.searchEnabled) position.top = position.top + scope.container.prop('offsetHeight');
        		scope.dropdownStyle = {top: position.top+'px', left: position.left+'px'};
        		if (scope.showOnTop(position))
        		{
        			delete scope.dropdownStyle.top;
        			scope.dropdownStyle.bottom = $window.scrollY + $window.innerHeight - $position.offset(scope.container).top + 'px';
        		}
        	}
        });
        scope.$on('$destroy', function(){
        	if ($select.appendToBody)
        	{
        		scope.choicesElement.remove();
        	}
        });
      };
    }
  };
}]);
