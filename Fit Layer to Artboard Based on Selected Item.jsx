#target illustrator

// Fit Layer to Artboard Based on Selected Item
// Scales and centers the entire layer containing the selected item to fit the artboard,
// maintaining the aspect ratio based on the selected object's dimensions.

function main() {
    // Check if a document is open
    if (app.documents.length === 0) {
        alert("No document is open.");
        return;
    }

    var doc = app.activeDocument;

    // Check if any object is selected
    if (app.selection.length === 0) {
        alert("No object is selected.");
        return;
    }

    var selectedItem = app.selection[0];
    if (!selectedItem) {
        alert("The selected item is invalid.");
        return;
    }

    // Get the top-level parent layer of the selected item
    var targetLayer = getTopLayer(selectedItem);

    if (!targetLayer) {
        alert("Failed to retrieve the layer of the selected item.");
        return;
    }

    // Check if the layer is visible and unlocked
    if (targetLayer.visible === false || targetLayer.locked === true) {
        alert("The layer is hidden or locked. Please unlock and make it visible.");
        return;
    }

    try {
        // Get the size and center of the artboard
        var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var artboardBounds = artboard.artboardRect;
        var artboardWidth = artboardBounds[2] - artboardBounds[0];
        var artboardHeight = artboardBounds[1] - artboardBounds[3];
        var artboardCenterX = artboardBounds[0] + artboardWidth / 2;
        var artboardCenterY = artboardBounds[1] - artboardHeight / 2;

        // Get the geometry of the selected item
        var selectedBounds = selectedItem.geometricBounds;
        var selectedWidth = selectedBounds[2] - selectedBounds[0];
        var selectedHeight = selectedBounds[1] - selectedBounds[3];
        var selectedCenterX = selectedBounds[0] + selectedWidth / 2;
        var selectedCenterY = selectedBounds[1] - selectedHeight / 2;

        if (selectedWidth <= 0 || selectedHeight <= 0) {
            alert("The size of the selected object is invalid.");
            return;
        }

        // Get all page items in the layer
        var layerItems = getAllPageItemsInLayer(targetLayer);

        if (layerItems.length === 0) {
            alert("There are no objects in the layer.");
            return;
        }

        // Get the geometry of the entire layer
        var layerBounds = getItemsBounds(layerItems);

        var layerWidth = layerBounds[2] - layerBounds[0];
        var layerHeight = layerBounds[1] - layerBounds[3];
        var layerCenterX = layerBounds[0] + layerWidth / 2;
        var layerCenterY = layerBounds[1] - layerHeight / 2;

        if (layerWidth <= 0 || layerHeight <= 0) {
            alert("The size of the objects in the layer is invalid.");
            return;
        }

        // Temporarily group all items in the layer
        var tempGroup = targetLayer.groupItems.add();
        for (var i = layerItems.length - 1; i >= 0; i--) {
            layerItems[i].moveToBeginning(tempGroup);
        }

        // Move the group so that the selected item's center aligns with the artboard's center
        var deltaX = artboardCenterX - selectedCenterX;
        var deltaY = artboardCenterY - selectedCenterY;
        tempGroup.translate(deltaX, deltaY);

        // Set the scaling reference point to the group's center
        var scaleAbout = Transformation.CENTER;

        // Scale the group based on the selected item, maintaining aspect ratio
        var scaleFactorX = (artboardWidth / selectedWidth) * 100;
        var scaleFactorY = (artboardHeight / selectedHeight) * 100;
        var scaleFactor = Math.min(scaleFactorX, scaleFactorY);

        tempGroup.resize(
            scaleFactor,  // scaleX
            scaleFactor,  // scaleY
            true,         // changePositions
            true,         // changeFillPatterns
            true,         // changeFillGradients
            true,         // changeStrokePattern
            scaleFactor,  // changeLineWidths
            scaleAbout    // scaleAbout
        );

        // After scaling, adjust the position again
        var newSelectedBounds = selectedItem.geometricBounds;
        var newSelectedWidth = newSelectedBounds[2] - newSelectedBounds[0];
        var newSelectedHeight = newSelectedBounds[1] - newSelectedBounds[3];
        var newSelectedCenterX = newSelectedBounds[0] + newSelectedWidth / 2;
        var newSelectedCenterY = newSelectedBounds[1] - newSelectedHeight / 2;

        var adjustX = artboardCenterX - newSelectedCenterX;
        var adjustY = artboardCenterY - newSelectedCenterY;

        tempGroup.translate(adjustX, adjustY);

        // Ungroup the temporary group and return items to the layer
        for (var j = tempGroup.pageItems.length - 1; j >= 0; j--) {
            tempGroup.pageItems[j].moveToBeginning(targetLayer);
        }
        tempGroup.remove();

    } catch (e) {
        alert("An error occurred: " + e.message);
    }
}

// Function to get the top-level parent layer of the selected item
function getTopLayer(item) {
    var parent = item;
    while (parent) {
        if (parent.typename === "Layer") {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}

// Function to get all page items in the layer
function getAllPageItemsInLayer(layer) {
    var items = [];
    collectAllPageItems(layer, items);
    return items;
}

function collectAllPageItems(container, items) {
    for (var i = 0; i < container.pageItems.length; i++) {
        var item = container.pageItems[i];
        items.push(item);
    }
    for (var j = 0; j < container.layers.length; j++) {
        collectAllPageItems(container.layers[j], items);
    }
}

// Function to get the combined bounding box of multiple items
function getItemsBounds(items) {
    var bounds = items[0].geometricBounds.slice();
    for (var i = 1; i < items.length; i++) {
        var itemBounds = items[i].geometricBounds;
        bounds[0] = Math.min(bounds[0], itemBounds[0]);
        bounds[1] = Math.max(bounds[1], itemBounds[1]);
        bounds[2] = Math.max(bounds[2], itemBounds[2]);
        bounds[3] = Math.min(bounds[3], itemBounds[3]);
    }
    return bounds;
}

main();
