import { CommonActions, NavigationProp } from '@react-navigation/native';

export function navigateToTab(
  navigation: NavigationProp<any>,
  tabName: string,
  screenName: string,
  params: object = {}
) {
  navigation.getParent()?.dispatch(
    CommonActions.navigate({ name: tabName, params: { screen: screenName, params } })
  );
}
