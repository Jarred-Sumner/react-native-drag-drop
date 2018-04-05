import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  TouchableOpacity
} from 'react-native';

class Draggable extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'Draggable';
        this._initiateDrag = this._initiateDrag.bind(this);
    }

    static contextTypes = {
      dragContext: PropTypes.any
    }

    static childContextTypes = {
      initiateDragging: PropTypes.func.isRequired
    }

    static propTypes = {
      dragOn: PropTypes.oneOf(['onLongPress', 'onPressIn', 'none'])
    }

    getChildContext() {
      return {
        initiateDragging: this._initiateDrag
      }
    }

    _initiateDrag() {
      if (!this.props.disabled) this.context.dragContext.onDrag(this.refs.wrapper, this.props.children, this.props.data);
    }

    static defaultProps = {
      dragOn: 'onLongPress'
    }

    render() {
        const {disabled, activeOpacity, style, dragOn, ...otherProps} = this.props;
        let isDragging = this.context.dragContext.dragging && this.context.dragContext.dragging.ref;
        isDragging = isDragging && isDragging === this.refs.wrapper;
        return <TouchableOpacity {...otherProps} disabled={this.props.disabled} activeOpacity={this.props.activeOpacity} style={this.props.style} onLongPress={this.props.dragOn === 'onLongPress' ? this._initiateDrag : undefined} onPressIn={this.props.dragOn === 'onPressIn' ? this._initiateDrag : undefined} ref="wrapper">
        {
          React.Children.map(this.props.children, child => {
          return React.cloneElement(child, {ghost: isDragging})
        })
        }
      </TouchableOpacity>;
    }
}

export default Draggable;
