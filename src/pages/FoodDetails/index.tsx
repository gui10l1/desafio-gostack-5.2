import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdditionalItem,
  AdditionalItemText,
  AdditionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  category: number;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [favortiteFood, setFavoriteFood] = useState<Omit<Food, 'extras'>>(
    {} as Omit<Food, 'extras'>,
  );

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`/foods/${routeParams.id}`);
      const response = await api.get<Array<Omit<Food, 'extras'>>>('/favorites');

      const findFavorite = response.data.find(item => item.id === data.id);

      if (findFavorite) {
        setFavoriteFood(findFavorite);
      }

      setIsFavorite(!!findFavorite);
      setFood(data);
      const extrasWithQuantity = data.extras.map(extra => {
        return {
          ...extra,
          quantity: 0,
        };
      });
      setExtras(extrasWithQuantity);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const extra = extras.find(item => item.id === id);

    if (!extra) {
      throw Error('Extra not found!');
    }

    extra.quantity += 1;

    setExtras(state => {
      const updatedExtras = state.map(item => {
        if (item.id === extra.id) {
          return extra;
        }

        return item;
      });

      return updatedExtras;
    });
  }

  function handleDecrementExtra(id: number): void {
    const extra = extras.find(item => item.id === id);

    if (!extra) {
      throw Error('Extra not found!');
    }

    if (extra?.quantity === 0) {
      return;
    }

    extra.quantity -= 1;

    setExtras(state => {
      const updatedExtras = state.map(item => {
        if (item.id === extra.id) {
          return extra;
        }

        return item;
      });

      return updatedExtras;
    });
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity === 1) {
      return;
    }

    setFoodQuantity(state => state - 1);
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`/favorites/${favortiteFood.id}`).then(() => {
        setIsFavorite(!isFavorite);
      });
    } else {
      api.post('/favorites', food).then(() => {
        setIsFavorite(!isFavorite);
      });
    }
  }, [isFavorite, food, favortiteFood.id]);

  const cartTotal = useMemo(() => {
    let totalExtrasPrice = 0;

    const foodPrice = food.price * foodQuantity;
    const extrasPrice = extras.map(item => {
      return item.value * item.quantity;
    });

    if (extrasPrice.length > 1) {
      totalExtrasPrice = extrasPrice.reduce((prev, crr) => {
        return prev + crr;
      });
    }

    return foodPrice + totalExtrasPrice;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const data = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: cartTotal,
      category: food.category,
      thumbnail_url: food.image_url,
      extras,
    };

    await api.post('/orders', data);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Dashboard',
        },
      ],
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdditionalItem key={extra.id}>
              <AdditionalItemText>{extra.name}</AdditionalItemText>
              <AdditionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdditionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdditionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdditionalQuantity>
            </AdditionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdditionalItemText testID="food-quantity">
                {foodQuantity}
              </AdditionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
