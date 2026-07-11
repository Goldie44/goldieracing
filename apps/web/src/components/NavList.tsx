import { Link } from "react-router-dom";
import { Bars2Icon } from "@heroicons/react/24/outline";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";

export default function NavList({
  items,
  activePath,
  isEditMode,
  droppableId,
  onReorder,
  onItemClick,
}) {
  const { t } = useTranslation("layout");
  const handleDragEnd = result => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  if (isEditMode) {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={droppableId}>
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {items.map((item, index) => (
                <Draggable key={item.path} draggableId={item.path} index={index}>
                  {dragProvided => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground bg-secondary/50 mb-1"
                    >
                      <Bars2Icon className="w-4 h-4 text-muted-foreground/60" />
                      <item.icon className="w-4 h-4" />
                      {t(item.labelKey)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  return (
    <>
      {items.map(item => {
        const isActive = activePath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {t(item.labelKey)}
            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </>
  );
}
