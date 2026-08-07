import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { userService, UserFavorite, SearchHistoryItem } from "../services/user.service";
import { useThemeColors } from "../theme/colors";

type Props = {
  onSelectDestination: (text: string) => void;
};

export function FavoritesAndHistoryView({ onSelectDestination }: Props) {
  const theme = useThemeColors();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [favs, hist] = await Promise.all([
        userService.getFavorites(),
        userService.getHistory(),
      ]);
      setFavorites(Array.isArray(favs) ? favs : []);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      console.log("Erro ao carregar favoritos/histórico:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveFavorite(id: number) {
    try {
      await userService.deleteFavorite(id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      Alert.alert("Erro", "Não foi possível remover o favorito.");
    }
  }

  async function handleClearHistory() {
    Alert.alert("Limpar histórico", "Tem certeza que deseja apagar todo seu histórico?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim, apagar", style: "destructive", onPress: async () => {
        try {
          await userService.clearHistory();
          setHistory([]);
        } catch (err) {
          Alert.alert("Erro", "Não foi possível limpar o histórico.");
        }
      }}
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Locais Favoritos</Text>
      {favorites.length === 0 ? (
        <Text style={styles.emptyText}>Você ainda não possui favoritos salvos.</Text>
      ) : (
        favorites.map(fav => (
          <View key={`fav-${fav.id}`} style={styles.itemCard}>
            <Pressable style={styles.itemContent} onPress={() => onSelectDestination(fav.name)}>
              <Ionicons name="star" size={24} color="#F59E0B" />
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemName}>{fav.name}</Text>
                <Text style={styles.itemAddress}>{fav.address}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => handleRemoveFavorite(fav.id)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Buscas Recentes</Text>
        {history.length > 0 && (
          <Pressable onPress={handleClearHistory}>
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        )}
      </View>
      
      {history.length === 0 ? (
        <Text style={styles.emptyText}>Seu histórico está vazio.</Text>
      ) : (
        history.map(item => (
          <Pressable 
            key={`hist-${item.id}`} 
            style={styles.itemCard}
            onPress={() => onSelectDestination(item.query)}
          >
            <Ionicons name="time-outline" size={24} color="#64748B" />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemName}>{item.query}</Text>
              {!!item.address && <Text style={styles.itemAddress}>{item.address}</Text>}
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 24,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 15,
    fontStyle: "italic",
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  itemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  itemAddress: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  }
});
