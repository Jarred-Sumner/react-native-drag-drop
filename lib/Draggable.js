import React from "react";
import PropTypes from "prop-types";
import { View, TouchableOpacity } from "react-native";
import {
  PanGestureHandler,
  State,
  TapGestureHandler
} from "react-native-gesture-handler";

class Draggable extends React.Component {
  static defaultProps = {
    delay: 50
  };

  constructor(props) {
    super(props);
    this.displayName = "Draggable";
    this._initiateDrag = this._initiateDrag.bind(this);
  }

  static contextTypes = {
    dragContext: PropTypes.any
  };

  static childContextTypes = {
    initiateDragging: PropTypes.func.isRequired
  };

  static propTypes = {
    dragOn: PropTypes.oneOf(["onLongPress", "onPressIn", "none"])
  };

  getChildContext() {
    return {
      initiateDragging: this._initiateDrag
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.usePanRecognizer !== this.props.usePanRecognizer) {
      if (this.props.usePanRecognizer) {
        console.log("SWITCHING TO PAN");
      } else {
        console.log("SWITCHING TO TAP");
      }
      this.cancelDrag();
    }
  }

  onPress = isFromPan => event => {
    if (isFromPan !== this.props.usePanRecognizer) {
      return;
    }
    const state = this.props.usePanRecognizer ? State.ACTIVE : State.BEGAN;
    if (state === event.nativeEvent.state && !this.props.disabled) {
      this.dragTimer = window.setTimeout(this._initiateDrag, this.props.delay);
    } else {
      this.cancelDrag(this.props.usePanRecognizer);
    }
  };

  cancelDrag = () => {
    clearTimeout(this.dragTimer);
    this.dragTimer = null;
  };

  componentWillUnmount() {
    this.cancelDrag();
  }

  _initiateDrag = () => {
    if (this.isDragging || this.props.disabled) {
      return;
    }

    console.log("initiate drag");

    this.context.dragContext.onDrag(
      this.wrapper,
      this.props.children,
      this.props.data
    );
  };

  get isDragging() {
    return (
      this.context.dragContext &&
      this.context.dragContext.dragging &&
      this.context.dragContext.dragging.data === this.props.data
    );
  }

  render() {
    const {
      disabled,
      panId,
      tapId,
      activeOpacity,
      style,
      simultaneousHandlers = [],
      usePanRecognizer = false,
      ...otherProps
    } = this.props;

    return (
      <PanGestureHandler
        {...otherProps}
        id={panId}
        enabled={usePanRecognizer && !disabled && !this.isDragging}
        onHandlerStateChange={this.onPress(true)}
        simultaneousHandlers={simultaneousHandlers}
      >
        <TapGestureHandler
          {...otherProps}
          id={tapId}
          enabled={!usePanRecognizer && !disabled && !this.isDragging}
          onHandlerStateChange={this.onPress(false)}
          simultaneousHandlers={simultaneousHandlers}
        >
          <View
            ref={wrapper => (this.wrapper = wrapper)}
            style={[
              this.props.style,
              {
                opacity: this.isDragging && !this.props.dragging ? 0 : 1
              }
            ]}
          >
            {React.Children.map(this.props.children, child => {
              return React.cloneElement(child, { ghost: this.isDragging });
            })}
          </View>
        </TapGestureHandler>
      </PanGestureHandler>
    );
  }
}

export default Draggable;
