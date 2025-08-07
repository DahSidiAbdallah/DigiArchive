"""Export utilities for documents."""

import csv
import io
import json
import xlsxwriter
from django.http import HttpResponse
from apps.documents.models import Document
from apps.documents.serializers.export_serializers import DocumentExportSerializer
from apps.documents.utils.audit_utils import log_user_activity


def export_documents_csv(request, queryset=None):
    """
    Export documents as CSV file.
    
    Args:
        request: HTTP request
        queryset: Optional queryset of documents to export
        
    Returns:
        HttpResponse with CSV file
    """
    # Get documents to export
    if queryset is None:
        user = request.user
        if user.is_staff:
            queryset = Document.objects.all()
        else:
            queryset = Document.objects.filter(uploaded_by=user)
    
    # Serialize documents
    serializer = DocumentExportSerializer(queryset, many=True)
    data = serializer.data
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="documents.csv"'
    
    # Create CSV writer
    writer = csv.writer(response)
    
    # Write header row
    if data:
        writer.writerow(data[0].keys())
        
        # Write data rows
        for item in data:
            writer.writerow(item.values())
    
    # Log export action
    if request.user.is_authenticated:
        log_user_activity(
            user=request.user,
            action_type='download',
            content_object=None,  # No specific document
            description=f"Exported {queryset.count()} documents as CSV",
            request=request
        )
    
    return response


def export_documents_excel(request, queryset=None):
    """
    Export documents as Excel file.
    
    Args:
        request: HTTP request
        queryset: Optional queryset of documents to export
        
    Returns:
        HttpResponse with Excel file
    """
    # Get documents to export
    if queryset is None:
        user = request.user
        if user.is_staff:
            queryset = Document.objects.all()
        else:
            queryset = Document.objects.filter(uploaded_by=user)
    
    # Serialize documents
    serializer = DocumentExportSerializer(queryset, many=True)
    data = serializer.data
    
    # Create in-memory output file
    output = io.BytesIO()
    
    # Create workbook and add a worksheet
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet('Documents')
    
    # Add formats
    header_format = workbook.add_format({'bold': True, 'bg_color': '#D9EAD3', 'border': 1})
    cell_format = workbook.add_format({'border': 1})
    date_format = workbook.add_format({'border': 1, 'num_format': 'yyyy-mm-dd'})
    
    # Write header row
    if data:
        headers = list(data[0].keys())
        for col_num, header in enumerate(headers):
            # Beautify header names
            header_display = header.replace('_', ' ').title()
            worksheet.write(0, col_num, header_display, header_format)
        
        # Write data rows
        for row_num, item in enumerate(data, start=1):
            for col_num, key in enumerate(headers):
                value = item[key]
                # Format dates specially
                if key in ['date'] and value:
                    try:
                        worksheet.write(row_num, col_num, value, date_format)
                    except:
                        worksheet.write(row_num, col_num, value, cell_format)
                else:
                    worksheet.write(row_num, col_num, value, cell_format)
        
        # Auto-fit columns
        for i, _ in enumerate(headers):
            worksheet.set_column(i, i, 20)
    
    # Close the workbook
    workbook.close()
    
    # Create response
    output.seek(0)
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="documents.xlsx"'
    
    # Log export action
    if request.user.is_authenticated:
        log_user_activity(
            user=request.user,
            action_type='download',
            content_object=None,  # No specific document
            description=f"Exported {queryset.count()} documents as Excel",
            request=request
        )
    
    return response


def export_documents_pdf(request, queryset=None):
    """
    Export documents as PDF file.
    
    Args:
        request: HTTP request
        queryset: Optional queryset of documents to export
        
    Returns:
        HttpResponse with PDF file
    """
    try:
        from django.template.loader import render_to_string
        from weasyprint import HTML
        
        # Get documents to export
        if queryset is None:
            user = request.user
            if user.is_staff:
                queryset = Document.objects.all()
            else:
                queryset = Document.objects.filter(uploaded_by=user)
        
        # Serialize documents
        serializer = DocumentExportSerializer(queryset, many=True)
        data = serializer.data
        
        # Create HTML content
        html_string = render_to_string(
            'documents/pdf_template.html', 
            {'documents': data}
        )
        
        # Generate PDF
        html = HTML(string=html_string)
        result = html.write_pdf()
        
        # Create response
        response = HttpResponse(result, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="documents.pdf"'
        
        # Log export action
        if request.user.is_authenticated:
            log_user_activity(
                user=request.user,
                action_type='download',
                content_object=None,  # No specific document
                description=f"Exported {queryset.count()} documents as PDF",
                request=request
            )
        
        return response
    
    except ImportError:
        # If weasyprint is not installed, return an error response
        return HttpResponse(
            "PDF export requires WeasyPrint library. Please install it or contact administrator.",
            status=500
        )
