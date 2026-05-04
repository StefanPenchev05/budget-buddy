import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMoneyTracker } from "@/src/composition/use-money-tracker";
import { Category } from "@/src/domain/money/types";
import { useSnackbar } from "@/src/shared/feedback/snackbar";
import { generateId } from "@/src/shared/ids/id-generator";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#95E1D3",
  "#FFD93D",
  "#6BCB77",
  "#FF8B94",
  "#A8DADC",
  "#4A90E2",
  "#F5A623",
  "#7ED321",
  "#BD10E0",
  "#50E3C2",
];

const ICONS = [
  "🍔",
  "🚗",
  "🎬",
  "🛍️",
  "💡",
  "⚕️",
  "📌",
  "💰",
  "💻",
  "📈",
  "🎁",
  "🔮",
  "🏠",
  "✈️",
  "📚",
  "☕",
  "🏋️",
  "🐶",
  "🎮",
  "🧾",
];

type FilterType = "all" | "expense" | "income";

function CategoryRow({
  category,
  onDelete,
}: Readonly<{
  category: Category;
  onDelete: (id: string, name: string) => void;
}>) {
  return (
    <TouchableOpacity
      style={styles.categoryItem}
      activeOpacity={0.85}
      onLongPress={() => onDelete(category.id, category.name)}
    >
      <View
        style={[styles.categoryGlow, { backgroundColor: category.color }]}
      />

      <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
      </View>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <View style={styles.categoryMetaRow}>
          <View
            style={[
              styles.typeDot,
              {
                backgroundColor:
                  category.type === "expense" ? "#FF6B6B" : "#2ECC71",
              },
            ]}
          />
          <Text style={styles.categorySubtext}>
            {category.type === "expense"
              ? "Expense category"
              : "Income category"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(category.id, category.name)}
      >
        <IconSymbol name="xmark" size={18} color="#8997B3" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function FilterButton({
  label,
  value,
  isActive,
  onSelect,
}: Readonly<{
  label: string;
  value: FilterType;
  isActive: boolean;
  onSelect: (value: FilterType) => void;
}>) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => onSelect(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          isActive && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const gridItemSize = (width - 32 - 24 - 24) / 4;

export default function CategoriesScreen() {
  const { categories, addCategory, deleteCategory } = useMoneyTracker();
  const { showSnackbar } = useSnackbar();

  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [categoryType, setCategoryType] = useState<"expense" | "income">(
    "expense",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      const matchesType =
        activeFilter === "all" || category.type === activeFilter;

      return matchesSearch && matchesType;
    });
  }, [categories, searchQuery, activeFilter]);

  const resetForm = () => {
    setCategoryName("");
    setSelectedIcon(ICONS[0]);
    setSelectedColor(COLORS[0]);
    setCategoryType("expense");
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleAddCategory = async () => {
    const name = categoryName.trim();

    if (!name) {
      Alert.alert("Missing name", "Please enter a category name.");
      return;
    }

    const alreadyExists = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.type === categoryType,
    );

    if (alreadyExists) {
      Alert.alert(
        "Duplicate category",
        `You already have a ${categoryType} category named "${name}".`,
      );
      return;
    }

    try {
      const newCategory: Category = {
        id: generateId(),
        name,
        color: selectedColor,
        icon: selectedIcon,
        type: categoryType,
      };

      await addCategory(newCategory);
      closeModal();
      showSnackbar({ message: "Category created" });
    } catch (error) {
      console.error(error);
      showSnackbar({ message: "Category not created", tone: "error" });
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      "Delete Category",
      `Delete "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCategory(id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroEyebrow}>Money Tracker</Text>
            <Text style={styles.heroTitle}>Categories</Text>
            <Text style={styles.heroSubtitle}>
              Organize income and expenses with custom colors and icons.
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <IconSymbol name="tag.fill" size={28} color="#141B2D" />
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{categories.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{expenseCategories.length}</Text>
            <Text style={styles.statLabel}>Expense</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{incomeCategories.length}</Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#8997B3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearSearch}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <FilterButton
            label="All"
            value="all"
            isActive={activeFilter === "all"}
            onSelect={setActiveFilter}
          />
          <FilterButton
            label="Expense"
            value="expense"
            isActive={activeFilter === "expense"}
            onSelect={setActiveFilter}
          />
          <FilterButton
            label="Income"
            value="income"
            isActive={activeFilter === "income"}
            onSelect={setActiveFilter}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Categories</Text>
            <Text style={styles.sectionSubtitle}>
              Long press a category to delete it.
            </Text>
          </View>

          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>
              {filteredCategories.length}
            </Text>
          </View>
        </View>

        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onDelete={handleDeleteCategory}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              name="folder.fill"
              size={52}
              color="#7C8CFF"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No categories found</Text>
            <Text style={styles.emptyText}>
              Try changing your search or create a new category.
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.9}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonIcon}>＋</Text>
        <Text style={styles.addButtonText}>New Category</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Category</Text>
                <Text style={styles.modalSubtitle}>
                  Customize how it appears in your tracker.
                </Text>
              </View>

              <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.previewCard}>
                <View
                  style={[
                    styles.previewIconCircle,
                    { backgroundColor: selectedColor },
                  ]}
                >
                  <Text style={styles.previewIcon}>{selectedIcon}</Text>
                </View>

                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>
                    {categoryName.trim() || "Category name"}
                  </Text>
                  <Text style={styles.previewType}>
                    {categoryType === "expense" ? "Expense" : "Income"}
                  </Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Type</Text>

                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      categoryType === "expense" && styles.typeButtonExpense,
                    ]}
                    onPress={() => setCategoryType("expense")}
                  >
                    <IconSymbol
                      name="arrow.down"
                      size={22}
                      color={categoryType === "expense" ? "#141B2D" : "#8997B3"}
                      style={styles.typeButtonIcon}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        categoryType === "expense" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Expense
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      categoryType === "income" && styles.typeButtonIncome,
                    ]}
                    onPress={() => setCategoryType("income")}
                  >
                    <IconSymbol
                      name="arrow.up"
                      size={22}
                      color={categoryType === "income" ? "#141B2D" : "#8997B3"}
                      style={styles.typeButtonIcon}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        categoryType === "income" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Name</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Groceries, Salary, Rent..."
                  value={categoryName}
                  onChangeText={setCategoryName}
                  placeholderTextColor="#8997B3"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Icon</Text>

                <View style={styles.grid}>
                  {ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconButton,
                        selectedIcon === icon && styles.iconButtonSelected,
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Text style={styles.icon}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Color</Text>

                <View style={styles.grid}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorButtonSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <IconSymbol
                          name="checkmark"
                          size={20}
                          color="#141B2D"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  !categoryName.trim() && styles.createButtonDisabled,
                ]}
                onPress={handleAddCategory}
                disabled={!categoryName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1020",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  heroCard: {
    backgroundColor: "#7C8CFF",
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  heroEyebrow: {
    color: "#8997B3",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  heroTitle: {
    color: "#141B2D",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 8,
  },

  heroSubtitle: {
    color: "#C7D2E5",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: width * 0.58,
  },

  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  heroIconText: {
    fontSize: 34,
  },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "#141B2D",
    borderRadius: 22,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F5F7FB",
  },

  statLabel: {
    fontSize: 12,
    color: "#8997B3",
    marginTop: 4,
    fontWeight: "600",
  },

  statDivider: {
    width: 1,
    backgroundColor: "#2B3654",
  },

  searchCard: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#141B2D",
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B3654",
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#F5F7FB",
  },

  clearSearch: {
    fontSize: 26,
    color: "#8997B3",
    paddingHorizontal: 6,
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#141B2D",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B3654",
  },

  filterButtonActive: {
    backgroundColor: "#7C8CFF",
    borderColor: "#7C8CFF",
  },

  filterButtonText: {
    color: "#8997B3",
    fontSize: 13,
    fontWeight: "800",
  },

  filterButtonTextActive: {
    color: "#141B2D",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F5F7FB",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#8997B3",
  },

  sectionBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7C8CFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  sectionBadgeText: {
    color: "#141B2D",
    fontWeight: "900",
  },

  categoryItem: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141B2D",
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2B3654",
  },

  categoryGlow: {
    position: "absolute",
    left: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.14,
  },

  categoryBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  categoryIcon: {
    fontSize: 26,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F5F7FB",
    marginBottom: 6,
  },

  categoryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  categorySubtext: {
    fontSize: 12,
    color: "#8997B3",
    fontWeight: "600",
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#202A44",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteButtonText: {
    fontSize: 24,
    lineHeight: 26,
    color: "#8997B3",
  },

  addButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#7C8CFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  addButtonIcon: {
    color: "#141B2D",
    fontSize: 22,
    marginRight: 8,
    fontWeight: "900",
  },

  addButtonText: {
    color: "#141B2D",
    fontSize: 16,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.55)",
  },

  modalContent: {
    backgroundColor: "#141B2D",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "92%",
    overflow: "hidden",
  },

  modalHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#334155",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  modalHeader: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F5F7FB",
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8997B3",
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#202A44",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCloseButton: {
    fontSize: 26,
    color: "#8997B3",
    lineHeight: 28,
  },

  modalBody: {
    paddingHorizontal: 18,
  },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141B2D",
    borderRadius: 22,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#2B3654",
  },

  previewIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  previewIcon: {
    fontSize: 30,
  },

  previewInfo: {
    flex: 1,
  },

  previewName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#F5F7FB",
  },

  previewType: {
    marginTop: 5,
    fontSize: 13,
    color: "#8997B3",
    fontWeight: "700",
  },

  formSection: {
    marginBottom: 24,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#F5F7FB",
    marginBottom: 10,
  },

  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },

  typeButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#141B2D",
    borderWidth: 1,
    borderColor: "#2B3654",
  },

  typeButtonExpense: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },

  typeButtonIncome: {
    backgroundColor: "#2ECC71",
    borderColor: "#2ECC71",
  },

  typeButtonIcon: {
    marginBottom: 6,
  },

  typeButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#8997B3",
  },

  typeButtonTextActive: {
    color: "#141B2D",
  },

  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#141B2D",
    borderWidth: 1,
    borderColor: "#2B3654",
    paddingHorizontal: 14,
    color: "#F5F7FB",
    fontSize: 15,
    fontWeight: "600",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  iconButton: {
    width: gridItemSize,
    height: gridItemSize,
    borderRadius: 18,
    backgroundColor: "#141B2D",
    borderWidth: 2,
    borderColor: "#2B3654",
    justifyContent: "center",
    alignItems: "center",
  },

  iconButtonSelected: {
    borderColor: "#7C8CFF",
    backgroundColor: "#252E61",
  },

  icon: {
    fontSize: 30,
  },

  colorButton: {
    width: gridItemSize,
    height: gridItemSize,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  colorButtonSelected: {
    borderWidth: 4,
    borderColor: "#7C8CFF",
  },

  colorCheckmark: {
    // kept for backwards-compat (no longer used)
    fontSize: 22,
    color: "#141B2D",
    fontWeight: "900",
  },

  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#2B3654",
  },

  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#202A44",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#E2E8F0",
    fontWeight: "900",
    fontSize: 15,
  },

  createButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#7C8CFF",
    justifyContent: "center",
    alignItems: "center",
  },

  createButtonDisabled: {
    backgroundColor: "#334155",
  },

  createButtonText: {
    color: "#141B2D",
    fontWeight: "900",
    fontSize: 15,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 70,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 19,
    color: "#F5F7FB",
    fontWeight: "900",
    marginBottom: 6,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#8997B3",
  },
});
