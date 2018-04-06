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
  dropZones: [],
  onDrag: null,
  onDragStart: null,
  onSnap: null,
  snapPoints: [],
  updateZone: null,
  removeZone: null
});

class DragContainer extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = "DragContainer";

    this.state = {
      dropZones: []
    };

    this._handleDragging = this._handleDragging.bind(this);
    this.updateZone = this.updateZone.bind(this);
    this.removeZone = this.removeZone.bind(this);
  }

  static propTypes = {
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func
  };

  handleDrag = selectedId => event => {
    if (
      event.nativeEvent.state === "end" &&
      selectedId === this.state.selectedId &&
      this.state.selectedId
    ) {
      this.setState({
        selectedId: null
      });

      if (this.props.onDragEnd) {
        this.props.onDragEnd();
      }
    }
  };

  handleSnap = selectedId => event => {
    if (event.nativeEvent.id === "start") {
      return;
    } else {
      if (this.props.onDrop) {
        this.props.onDrop({
          id: event.nativeEvent.id,
          selectedId: this.state.selectedId
        });
      }
    }
  };

  updateZone(details) {
    let zone = this.state.dropZones.find(x => x.ref === details.ref);
    if (!zone) {
      this.setState({
        dropZones: [...this.state.dropZones, details]
      });
    } else {
      let i = this.state.dropZones.indexOf(zone);
      const dropZones = this.state.dropZones.slice();
      dropZones.splice(i, 1, details);
      this.setState({
        dropZones
      });
    }
  }

  removeZone(ref) {
    let i = this.state.dropZones.find(x => x.ref === ref);
    if (i !== -1) {
      const dropZones = this.state.dropZones.slice();
      dropZones.splice(i, 1, details);
      this.setState({
        dropZones
      });
    }
  }

  inZone({ x, y }, zone) {
    return (
      zone.x <= x &&
      zone.width + zone.x >= x &&
      zone.y <= y &&
      zone.height + zone.y >= y
    );
  }
  _addLocationOffset(point) {
    if (!this.state.selectedId) return point;
    return {
      x:
        point.x +
        (this.state.startPosition ? this.state.startPosition.width / 2 : 0),
      y:
        point.y +
        (this.state.startPosition ? this.state.startPosition.height / 2 : 0)
    };
  }

  _handleDragging(point) {
    this.state.dropZones.forEach(zone => {
      if (this.inZone(point, zone)) {
        zone.onEnter(point);
      } else {
        zone.onLeave(point);
      }
    });
  }

  onDragStart = (ref, id) => {
    this.setState({
      selectedId: id
    });
    ref.measure(({ width, height, x, y }) => {
      this.setState(
        {
          startPosition: {
            width,
            height,
            x,
            y
          }
        },
        () => {
          this.props.onDragStart(id);
        }
      );
    });
  };

  render() {
    const { style, enabled = true, children, ...otherProps } = this.props;

    return (
      <DragContext.Provider
        value={{
          selectedId: this.state.selectedId,
          dropZones: this.state.dropZones,
          onDrag: this.handleDrag,
          onDragStart: this.onDragStart,
          onSnap: this.onSnap,
          snapPoints: this.state.snapPoints,
          updateZone: this.updateZone,
          removeZone: this.removeZone
        }}
      >
        <View style={[{ flex: 1 }, style]}>{children}</View>
      </DragContext.Provider>
    );
  }
}

export default DragContainer;
