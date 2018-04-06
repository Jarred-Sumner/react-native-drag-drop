import React from "react";
import createReactContext from "create-react-context";
import PropTypes from "prop-types";
import {
  View,
  PanResponder,
  Modal,
  Easing,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback
} from "react-native";
import {
  PanGestureHandler,
  TapGestureHandler,
  State
} from "react-native-gesture-handler";
import Interactable from "react-native-interactable";

global.Easing = Easing;

const allOrientations = [
  "portrait",
  "portrait-upside-down",
  "landscape",
  "landscape-left",
  "landscape-right"
];

export const DragContext = createReactContext({
  selectedId: null,
  onDragEnd: null,
  onDragStart: null,
  finishDrag: null,
  onDrop: null,
  hasMoved: false
});

class DragContainer extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = "DragContainer";

    this.state = {
      dragState: this.buildDragState({ selectedId: null, hasMoved: false }),
      hasMoved: false,
      selectedId: null
    };
  }

  static propTypes = {
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func
  };

  handleDrag = selectedId => event => {
    console.log("DRAG", event.nativeEvent.state);
    if (event.nativeEvent.state === "end") {
      if (this.props.onDragEnd) {
        this.props.onDragEnd();
      }
    } else if (event.nativeEvent.state === "start") {
      this.setState({
        hasMoved: true
      });
    }
  };

  handleDrop = selectedId => event => {
    if (this.props.onDrop) {
      this.props.onDrop(event, selectedId);
    }
  };

  handleFinishDragging = (selectedId, triggerOnDragEnd = false) => event => {
    if (this.state.hasMoved && triggerOnDragEnd) {
      return;
    }

    this.setState({
      hasMoved: false,
      selectedId: null
    });

    if (triggerOnDragEnd && this.props.onDragEnd) {
      this.props.onDragEnd();
    }
  };

  onDragStart = ({ id }) => {
    if (this.props.onDragEnd) {
      this.props.onDragEnd();
    }

    this.setState(
      {
        selectedId: id,
        hasMoved: false
      },
      () => {
        this.props.onDragStart(id);
      }
    );
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedId !== this.state.selectedId) {
      this.setState({
        dragState: this.buildDragState({
          selectedId: this.state.selectedId,
          hasMoved: this.state.hasMoved
        })
      });
    }
  }

  buildDragState = ({ selectedId, hasMoved = false }) => {
    return {
      selectedId,
      onDragEnd: this.handleDrag,
      finishDrag: this.handleFinishDragging,
      onDragStart: this.onDragStart,
      onDrop: this.handleDrop,
      hasMoved: hasMoved
    };
  };

  render() {
    const { style, enabled = true, children, ...otherProps } = this.props;
    return (
      <DragContext.Provider value={this.state.dragState}>
        {children}
      </DragContext.Provider>
    );
  }
}

export default DragContainer;
