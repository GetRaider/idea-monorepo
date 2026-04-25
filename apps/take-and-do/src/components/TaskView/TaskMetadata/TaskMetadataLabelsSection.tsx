"use client";

import { DotsVerticalIcon } from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { getLabelAccent } from "@/helpers/label-color.helper";
import type { TaskMetadataModel } from "@/hooks/taskMetadata/useTaskMetadataModel";

import {
  AddLabelTag,
  CreateLabelSpan,
  LabelDropdown,
  LabelDropdownEditInput,
  LabelDropdownInput,
  LabelDropdownItem,
  LabelDropdownRow,
  LabelDropdownRowLabelText,
  LabelDropdownRowToggle,
  LabelRowActions,
  Tag,
  TagDot,
  TagText,
} from "./TaskMetadata.ui";

type TaskMetadataLabelsSectionProps = {
  model: TaskMetadataModel;
  labelMenuPlacement?: "up" | "down";
};

export function TaskMetadataLabelsSection({
  model,
  labelMenuPlacement = "down",
}: TaskMetadataLabelsSectionProps) {
  const {
    task,
    labelDropdownRef,
    isLabelDropdownOpen,
    setIsLabelDropdownOpen,
    availableLabels,
    labelSearchValue,
    setLabelSearchValue,
    openMenuLabelName,
    setOpenMenuLabelName,
    editingCatalogLabel,
    setEditingCatalogLabel,
    editingCatalogLabelValue,
    setEditingCatalogLabelValue,
    filteredCatalogLabels,
    handleLabelDropdownToggle,
    handleToggleLabelOnTask,
    handleCatalogLabelAction,
    handleSaveCatalogLabelRename,
    handleCreateAndSelectLabel,
    handleRemoveLabel,
  } = model;

  return (
    <>
      {task.labels?.map((label) => {
        const accent = getLabelAccent(label);
        return (
          <Tag
            key={label}
            tintBg={accent.tintBg}
            tintHoverBg={accent.tintHoverBg}
            tintBorder={accent.tintBorder}
            onClick={() => handleRemoveLabel(label)}
            title="Click to remove"
          >
            <TagDot color={accent.dot} />
            <TagText>{label}</TagText>
          </Tag>
        );
      })}

      <div ref={labelDropdownRef} className="relative shrink-0">
        <AddLabelTag onClick={handleLabelDropdownToggle} title="Add label">
          + Label
        </AddLabelTag>
        <LabelDropdown
          isOpen={isLabelDropdownOpen}
          placement={labelMenuPlacement}
        >
          <LabelDropdownInput
            type="text"
            value={labelSearchValue}
            onChange={(e) => setLabelSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateAndSelectLabel();
              } else if (e.key === "Escape") {
                setIsLabelDropdownOpen(false);
                setLabelSearchValue("");
                setEditingCatalogLabel(null);
                setOpenMenuLabelName(null);
              }
            }}
            placeholder="Search or create..."
            autoFocus={isLabelDropdownOpen}
            maxLength={32}
          />
          {filteredCatalogLabels.map((label) => {
            const accent = getLabelAccent(label);
            const onTask = !!task.labels?.includes(label);
            const isEditingRow = editingCatalogLabel === label;
            const isMenuOpen = openMenuLabelName === label;

            return (
              <LabelDropdownRow
                key={label}
                activeMenu={isMenuOpen}
                data-menu-open={isMenuOpen ? "true" : undefined}
              >
                {isEditingRow ? (
                  <LabelDropdownEditInput
                    value={editingCatalogLabelValue}
                    onChange={(e) =>
                      setEditingCatalogLabelValue(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSaveCatalogLabelRename(label);
                      }
                      if (e.key === "Escape") {
                        setEditingCatalogLabel(null);
                        setEditingCatalogLabelValue("");
                      }
                    }}
                    onBlur={(e) => {
                      const next = e.relatedTarget as HTMLElement | null;
                      if (
                        next?.closest("[data-dropdown-portal]") ||
                        (next &&
                          labelDropdownRef.current?.contains(next) &&
                          next.closest('[aria-haspopup="menu"]'))
                      )
                        return;
                      void handleSaveCatalogLabelRename(label);
                    }}
                    autoFocus
                    maxLength={32}
                  />
                ) : (
                  <>
                    <LabelDropdownRowToggle
                      type="button"
                      onTask={onTask}
                      onClick={() => handleToggleLabelOnTask(label)}
                      title={onTask ? "Remove from task" : "Add to task"}
                    >
                      <TagDot color={accent.dot} />
                      <LabelDropdownRowLabelText>
                        {label}
                      </LabelDropdownRowLabelText>
                    </LabelDropdownRowToggle>
                    <LabelRowActions>
                      <Dropdown
                        options={[
                          { label: "Edit", value: "edit" },
                          { label: "Delete", value: "delete", danger: true },
                        ]}
                        onChange={(value) =>
                          handleCatalogLabelAction(label, value)
                        }
                        trigger={
                          <span data-label-actions-trigger>
                            <DotsVerticalIcon size={14} />
                          </span>
                        }
                        onOpenChange={(open) =>
                          setOpenMenuLabelName(open ? label : null)
                        }
                      />
                    </LabelRowActions>
                  </>
                )}
              </LabelDropdownRow>
            );
          })}
          {labelSearchValue.trim() &&
            !availableLabels.some(
              (l) => l.toLowerCase() === labelSearchValue.toLowerCase(),
            ) && (
              <LabelDropdownItem onClick={handleCreateAndSelectLabel}>
                <CreateLabelSpan
                  accentColor={getLabelAccent(labelSearchValue.trim()).dot}
                >
                  +
                </CreateLabelSpan>
                Create &quot;{labelSearchValue}&quot;
              </LabelDropdownItem>
            )}
        </LabelDropdown>
      </div>
    </>
  );
}
