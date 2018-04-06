import React from "react";
import PropTypes from "prop-types";
import { View, TouchableOpacity } from "react-native";
import {
  PanGestureHandler,
  State,
  TapGestureHandler
} from "react-native-gesture-handler";
import Interactable from "react-native-interactable";
import { DragContext } from "./DragContainer";

class Draggable extends React.Component {
  static defaultProps = {
    delay: 150
  };

  constructor(props) {
    super(props);
    this.displayName = "Draggable";
    this._initiateDrag = this._initiateDrag.bind(this);

    this.state = {};
  }

  static contextTypes = {
    dragContext: PropTypes.any
  };

  static childContextTypes = {
    initiateDragging: PropTypes.func.isRequired
  };

  getChildContext() {
    return {
      initiateDragging: this._initiateDrag
    };
  }

  onPress = event => {
    if (State.BEGAN === event.nativeEvent.state && !this.props.disabled) {
      this.dragTimer = window.setTimeout(this._initiateDrag, this.props.delay);
    } else {
      this.cancelDrag();
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
    if (this.isDefinitelyDragging || this.props.disabled) {
      return;
    }

    this.props.onDragStart(this.wrapper, this.props.data);
    this.setState({ forceEnableDragging: true });
  };

  get isDefinitelyDragging() {
    return this.props && this.props.selectedId === this.props.data;
  }

  get isDragging() {
    return this.state.forceEnableDragging || this.isDefinitelyDragging;
  }

  render() {
    const {
      disabled,
      panId,
      tapId,
      activeOpacity,
      style,
      simultaneousHandlers = [],
      gravityPoints,
      springPoints,
      frictionAreas,
      animatedNativeDriver = true,
      dragToss,
      usePanRecognizer = false,
      animatedValueY,
      alertAreas,
      ...otherProps
    } = this.props;

    return (
      <TapGestureHandler
        {...otherProps}
        id={tapId}
        enabled={!disabled && !this.isDefinitelyDragging}
        onHandlerStateChange={this.onPress}
        simultaneousHandlers={simultaneousHandlers}
      >
        <Interactable.View
          onSnap={this.props.onSnap(this.props.data)}
          onDrag={this.props.onDrag(this.props.data)}
          gravityPoints={gravityPoints}
          springPoints={springPoints}
          dragWithSpring={{ tension: 2000, damping: 0.5 }}
          animatedNativeDriver={animatedNativeDriver}
          animatedValueY={animatedValueY}
          frictionAreas={frictionAreas}
          alertAreas={alertAreas}
          dragToss={dragToss}
          snapPoints={[
            {
              x: 0,
              y: 0,
              id: "start",
              damping: 0.75
            },
            ...this.props.zones
          ]}
          boundaries={
            !this.isDragging
              ? {
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0
                }
              : undefined
          }
        >
          <View
            ref={wrapper => (this.wrapper = wrapper)}
            style={[this.props.style]}
          >
            {React.Children.map(this.props.children, child => {
              return React.cloneElement(child, { ghost: this.isDragging });
            })}
          </View>
        </Interactable.View>
      </TapGestureHandler>
    );
  }
}

export default props => {
  return (
    <DragContext.Consumer>
      {consumerProps => <Draggable {...consumerProps} {...props} />}
    </DragContext.Consumer>
  );
};
