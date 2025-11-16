import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { BookingsService } from './bookings.service';

@ApiTags('events')
@Controller('api/events')
export class EventsController {
    constructor(
        private readonly eventsService: EventsService,
        private readonly bookingsService: BookingsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    async createEvent(@Body() dto: any) {
        try {
            const event = await this.eventsService.createEvent(dto);
            return { success: true, data: event };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all active events' })
    @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
    async getActiveEvents() {
        try {
            const events = await this.eventsService.getActiveEvents();
            return { success: true, data: events };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get event by ID' })
    @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
    async getEventById(@Param('id') id: string) {
        try {
            const event = await this.eventsService.getEventById(id);
            return { success: true, data: event };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update event' })
    @ApiResponse({ status: 200, description: 'Event updated successfully' })
    async updateEvent(@Param('id') id: string, @Body() dto: any) {
        try {
            const event = await this.eventsService.updateEvent(id, dto);
            return { success: true, data: event };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancel event' })
    @ApiResponse({ status: 200, description: 'Event cancelled successfully' })
    async cancelEvent(@Param('id') id: string, @Body() body: { reason: string }) {
        try {
            const event = await this.eventsService.cancelEvent(id, body.reason);
            return { success: true, data: event };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('stats/overview')
    @ApiOperation({ summary: 'Get event statistics' })
    @ApiResponse({ status: 200, description: 'Event statistics retrieved' })
    async getEventStats() {
        try {
            const stats = await this.eventsService.getEventStats();
            return { success: true, data: stats };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Post('bookings')
    @ApiOperation({ summary: 'Create a new booking' })
    @ApiResponse({ status: 201, description: 'Booking created successfully' })
    async createBooking(@Body() dto: any) {
        try {
            const booking = await this.bookingsService.createBooking(dto);
            return { success: true, data: booking };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('bookings/family/:familyId')
    @ApiOperation({ summary: 'Get family bookings' })
    @ApiResponse({ status: 200, description: 'Family bookings retrieved' })
    async getFamilyBookings(@Param('familyId') familyId: string) {
        try {
            const bookings = await this.bookingsService.getFamilyBookings(familyId);
            return { success: true, data: bookings };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('bookings/event/:eventId')
    @ApiOperation({ summary: 'Get event bookings' })
    @ApiResponse({ status: 200, description: 'Event bookings retrieved' })
    async getEventBookings(@Param('eventId') eventId: string) {
        try {
            const bookings = await this.bookingsService.getEventBookings(eventId);
            return { success: true, data: bookings };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Put('bookings/:id/confirm')
    @ApiOperation({ summary: 'Confirm booking' })
    @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
    async confirmBooking(@Param('id') id: string) {
        try {
            const booking = await this.bookingsService.confirmBooking(id);
            return { success: true, data: booking };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Put('bookings/:id/cancel')
    @ApiOperation({ summary: 'Cancel booking' })
    @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
    async cancelBooking(@Param('id') id: string, @Body() body: { reason?: string }) {
        try {
            const booking = await this.bookingsService.cancelBooking(id, body.reason);
            return { success: true, data: booking };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('bookings/stats/overview')
    @ApiOperation({ summary: 'Get booking statistics' })
    @ApiResponse({ status: 200, description: 'Booking statistics retrieved' })
    async getBookingStats() {
        try {
            const stats = await this.bookingsService.getBookingStats();
            return { success: true, data: stats };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
