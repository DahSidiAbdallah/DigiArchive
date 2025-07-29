"""Search URLs configuration."""

from django.urls import path
from apps.search import views

app_name = 'search'

urlpatterns = [
    path('advanced/', views.AdvancedSearchView.as_view(), name='advanced_search'),
    path('suggestions/', views.SearchSuggestionsView.as_view(), name='search_suggestions'),
]
